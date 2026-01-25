# FEATURE_3.4: Implement View Tracking

## ✅ IMPLEMENTATION STATUS: 100% COMPLETE

**Verificado en producción: Sin fallos ✅**

---

## 1. Natural Language Description

### Estado Actual
La página pública `/:username` renderiza el perfil del usuario con sus links. Cada click en un link es trackeado via `/go/:linkId` que incrementa:
- `links.totalClicks` (contador global)
- `daily_link_clicks` (registro diario por link)

Sin embargo:
- **NO se trackean las vistas** de la página pública
- `biolinks.totalViews` existe pero siempre es 0
- `daily_stats.views` nunca se rellena
- `daily_stats.clicks` nunca se rellena (aunque los clicks individuales sí se guardan)
- No existe mecanismo para evitar conteos inflados por recargas de página

### Estado Esperado
Después de esta task:
1. Cada visita a `/:username` incrementará `biolinks.totalViews`
2. Se creará/actualizará un registro en `daily_stats` con las vistas del día
3. Una cookie de sesión (`_blv`) con TTL de 30 minutos evitará conteos duplicados por usuario
4. La cookie es **por biolink**: visitar `carlos/` y luego `maria/` cuenta ambas vistas, pero recargar `carlos/` no cuenta de nuevo por 30 min
5. El click tracking existente también actualizará `daily_stats.clicks` además de `daily_link_clicks`

---

## 2. Technical Description

### Arquitectura General
- **Server-side tracking**: El tracking ocurre en el loader de la ruta pública, antes de retornar los datos
- **Cookie-based deduplication**: Cookie `_blv` (biolinq visitor) con formato `biolinkId1:timestamp1|biolinkId2:timestamp2`
- **Atomic DB operations**: Usar transacciones para garantizar consistencia entre `totalViews` y `daily_stats`

### Flujo de Vista
```
1. Usuario visita /:username
2. Loader obtiene biolink por username
3. Leer cookie _blv
4. Verificar si este biolinkId tiene timestamp < 30 min
   - SI: no trackear (vista reciente)
   - NO: trackear vista + actualizar cookie
5. Si trackear: llamar trackView(biolinkId) que:
   - Incrementa biolinks.totalViews
   - Inserta/actualiza daily_stats.views
6. Retornar datos normalmente
```

### Actualización del Click Tracking
Modificar `trackClickAndGetUrl()` para también actualizar `daily_stats.clicks` cuando se hace click.

---

## 2.1. Architecture Gate

- **Pages are puzzles:** La ruta `public.tsx` solo compone `PublicProfile`. El tracking se ejecuta en el loader llamando a un servicio.
- **Loaders/actions are thin:** El loader parsea el request (cookies), llama al servicio `trackView()`, y retorna datos. No hay lógica de negocio inline.
- **Business logic is not in components:**
  - Lógica de tracking → `app/services/views.server.ts` (nuevo)
  - Cookie parsing/writing → `app/lib/view-cookie.server.ts` (nuevo)
  - Componentes no cambian

### Servicios que llama la ruta:
- `getBiolinkWithUserByUsername()` (existente)
- `getPublicLinksByBiolinkId()` (existente)
- `trackView()` (nuevo, solo si cookie lo permite)

### Hooks en componentes:
- Ninguno nuevo. El tracking es completamente server-side.

---

## 3. Files to Change/Create

### `app/lib/view-cookie.server.ts` (NUEVO)
**Objective:** Manejar la lectura y escritura de la cookie `_blv` que contiene los biolinks visitados recientemente con sus timestamps.

**Pseudocode:**
```pseudocode
// Constantes
COOKIE_NAME = "_blv"
TTL_MINUTES = 30
MAX_ENTRIES = 50  // Limitar tamaño de cookie

// Tipo interno
TYPE ViewEntry = { biolinkId: string, timestamp: number }

FUNCTION parseViewCookie(cookieHeader: string | null): ViewEntry[]
  IF cookieHeader IS NULL THEN RETURN []

  // Buscar cookie _blv en header
  cookies = parseCookieHeader(cookieHeader)
  rawValue = cookies[COOKIE_NAME]
  IF rawValue IS NULL THEN RETURN []

  // Formato: "id1:ts1|id2:ts2|..."
  TRY
    entries = rawValue.split("|")
    RETURN entries.map(entry => {
      [id, ts] = entry.split(":")
      RETURN { biolinkId: id, timestamp: parseInt(ts) }
    }).filter(e => isValidEntry(e))
  CATCH
    RETURN []  // Cookie corrupta, empezar fresco
END

FUNCTION shouldTrackView(entries: ViewEntry[], biolinkId: string): boolean
  now = Date.now()
  threshold = now - (TTL_MINUTES * 60 * 1000)

  existingEntry = entries.find(e => e.biolinkId === biolinkId)
  IF existingEntry IS NULL THEN RETURN true

  // Si el timestamp es anterior al threshold, trackear
  RETURN existingEntry.timestamp < threshold
END

FUNCTION updateViewCookie(entries: ViewEntry[], biolinkId: string): string
  now = Date.now()
  threshold = now - (TTL_MINUTES * 60 * 1000)

  // Filtrar entradas expiradas y actualizar/agregar la actual
  filtered = entries.filter(e => e.timestamp >= threshold AND e.biolinkId !== biolinkId)

  // Agregar nueva entrada
  newEntries = [...filtered, { biolinkId, timestamp: now }]

  // Limitar tamaño (mantener los más recientes)
  IF newEntries.length > MAX_ENTRIES
    newEntries = newEntries.slice(-MAX_ENTRIES)

  // Serializar: "id1:ts1|id2:ts2"
  value = newEntries.map(e => `${e.biolinkId}:${e.timestamp}`).join("|")

  RETURN serializeCookie(COOKIE_NAME, value, {
    maxAge: 24 * 60 * 60,  // 24 horas de vida de cookie
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production"
  })
END
```

---

### `app/services/views.server.ts` (NUEVO)
**Objective:** Contener la lógica de tracking de vistas: incrementar `biolinks.totalViews` y `daily_stats.views` atomicamente.

**Pseudocode:**
```pseudocode
IMPORT db, biolinks, dailyStats FROM "~/db"
IMPORT sql, eq FROM "drizzle-orm"

FUNCTION trackView(biolinkId: string): Promise<void>
  RETURN db.transaction(async (tx) => {
    // 1. Incrementar totalViews en biolinks
    AWAIT tx.update(biolinks)
      .set({
        totalViews: sql`${biolinks.totalViews} + 1`,
        updatedAt: new Date()
      })
      .where(eq(biolinks.id, biolinkId))

    // 2. Insertar o actualizar daily_stats.views
    today = sql`DATE_TRUNC('day', NOW())`

    AWAIT tx.insert(dailyStats)
      .values({
        biolinkId,
        date: today,
        views: 1,
        clicks: 0  // clicks se actualiza por separado
      })
      .onConflictDoUpdate({
        target: [dailyStats.biolinkId, dailyStats.date],
        set: { views: sql`${dailyStats.views} + 1` }
      })
  })
END
```

---

### `app/services/links.server.ts` (MODIFICAR)
**Objective:** Actualizar `trackClickAndGetUrl()` para también incrementar `daily_stats.clicks`.

**Pseudocode:**
```pseudocode
// MODIFICAR función existente trackClickAndGetUrl

FUNCTION trackClickAndGetUrl(linkId: string): Promise<TrackClickResult>
  RETURN db.transaction(async (tx) => {
    // 1. Buscar link y su biolinkId (AGREGAR biolinkId al select)
    linkResult = AWAIT tx.select({
      id: links.id,
      url: links.url,
      biolinkId: links.biolinkId  // NUEVO
    })
    .from(links)
    .where(eq(links.id, linkId))
    .limit(1)

    IF linkResult.length === 0 THEN
      RETURN { success: false, error: 'LINK_NOT_FOUND' }

    link = linkResult[0]
    today = sql`DATE_TRUNC('day', NOW())`

    // 2. Incrementar totalClicks en links (existente)
    AWAIT tx.update(links)
      .set({
        totalClicks: sql`${links.totalClicks} + 1`,
        updatedAt: new Date()
      })
      .where(eq(links.id, linkId))

    // 3. Insertar/actualizar daily_link_clicks (existente)
    AWAIT tx.insert(dailyLinkClicks)
      .values({ linkId, date: today, clicks: 1 })
      .onConflictDoUpdate({
        target: [dailyLinkClicks.linkId, dailyLinkClicks.date],
        set: { clicks: sql`${dailyLinkClicks.clicks} + 1` }
      })

    // 4. NUEVO: Insertar/actualizar daily_stats.clicks
    AWAIT tx.insert(dailyStats)
      .values({
        biolinkId: link.biolinkId,
        date: today,
        views: 0,  // views se actualiza por separado
        clicks: 1
      })
      .onConflictDoUpdate({
        target: [dailyStats.biolinkId, dailyStats.date],
        set: { clicks: sql`${dailyStats.clicks} + 1` }
      })

    RETURN { success: true, url: link.url }
  })
END
```

---

### `app/routes/public.tsx` (MODIFICAR)
**Objective:** Integrar el tracking de vistas en el loader, leyendo/escribiendo la cookie `_blv`.

**Pseudocode:**
```pseudocode
IMPORT { parseViewCookie, shouldTrackView, updateViewCookie } FROM "~/lib/view-cookie.server"
IMPORT { trackView } FROM "~/services/views.server"

// Loader existente - MODIFICAR
ASYNC FUNCTION loader({ params, request }: LoaderFunctionArgs)
  username = params.username
  IF !username THEN throw 404

  result = AWAIT getBiolinkWithUserByUsername(username)
  IF !result THEN throw 404

  // NUEVO: Track view con cookie deduplication
  cookieHeader = request.headers.get("Cookie")
  entries = parseViewCookie(cookieHeader)

  shouldTrack = shouldTrackView(entries, result.biolink.id)

  headers = new Headers()
  IF shouldTrack THEN
    AWAIT trackView(result.biolink.id)
    setCookieHeader = updateViewCookie(entries, result.biolink.id)
    headers.set("Set-Cookie", setCookieHeader)
  END

  links = AWAIT getPublicLinksByBiolinkId(result.biolink.id)

  // Retornar data con headers
  RETURN data(
    { biolink: result.biolink, user: result.user, links },
    { headers }
  )
END

// Componente - SIN CAMBIOS
FUNCTION PublicPage()
  data = useLoaderData<typeof loader>()
  RETURN <PublicProfile user={data.user} biolink={data.biolink} links={data.links} />
END

// meta, ErrorBoundary - SIN CAMBIOS
```

---

### `tests/fixtures/seeders.ts` (MODIFICAR)
**Objective:** Agregar la tabla `daily_stats` al schema de tests para que los E2E tests puedan verificar el tracking.

**Pseudocode:**
```pseudocode
// En función createAuthSchema(), DESPUÉS de crear daily_link_clicks:

// AGREGAR: Create daily_stats table
AWAIT executeSQL(ctx, `
  CREATE TABLE IF NOT EXISTS daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    biolink_id UUID NOT NULL REFERENCES biolinks(id) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT now()
  )
`)

AWAIT executeSQL(ctx, `
  CREATE UNIQUE INDEX IF NOT EXISTS unique_biolink_date
  ON daily_stats(biolink_id, date)
`)

AWAIT executeSQL(ctx, `
  CREATE INDEX IF NOT EXISTS idx_daily_stats_biolink_date
  ON daily_stats(biolink_id, date)
`)
```

---

## 4. I18N

Esta task no requiere cambios de UI visibles ni nuevos textos. No hay nuevas keys de i18n.

---

## 5. E2E Test Plan

### Test File: `tests/e2e/view-tracking.spec.ts` (NUEVO)

#### Test 1: View increments totalViews
- **Preconditions:** Usuario con biolink sin vistas previas
- **Steps:**
  1. Seed user y biolink con `totalViews = 0`
  2. Hacer GET a `/:username`
  3. Consultar DB: `SELECT total_views FROM biolinks WHERE id = $1`
- **Expected:** `total_views = 1`

#### Test 2: View creates record in daily_stats
- **Preconditions:** Usuario con biolink, tabla daily_stats vacía
- **Steps:**
  1. Seed user y biolink
  2. Hacer GET a `/:username`
  3. Consultar DB: `SELECT views, clicks FROM daily_stats WHERE biolink_id = $1`
- **Expected:** 1 registro con `views = 1, clicks = 0`

#### Test 3: Cookie prevents duplicate view within 30 minutes
- **Preconditions:** Usuario con biolink
- **Steps:**
  1. Seed user y biolink
  2. Crear context de request con cookie store
  3. Hacer GET a `/:username` (1ra vez)
  4. Guardar cookies de respuesta
  5. Hacer GET a `/:username` con mismas cookies (2da vez)
  6. Consultar DB: `SELECT total_views FROM biolinks`
- **Expected:** `total_views = 1` (no 2)

#### Test 4: Different biolinks track separately
- **Preconditions:** Dos usuarios con biolinks diferentes
- **Steps:**
  1. Seed user1 con biolink "alice"
  2. Seed user2 con biolink "bob"
  3. Con mismas cookies: visitar `/alice`, luego `/bob`
  4. Consultar DB para ambos biolinks
- **Expected:** Ambos tienen `total_views = 1`

#### Test 5: Click tracking updates daily_stats.clicks
- **Preconditions:** Usuario con biolink y un link
- **Steps:**
  1. Seed user, biolink, y link
  2. Hacer GET a `/go/:linkId`
  3. Consultar DB: `SELECT clicks FROM daily_stats WHERE biolink_id = $1`
- **Expected:** `clicks = 1`

#### Test 6: View and click on same day accumulate correctly
- **Preconditions:** Usuario con biolink y link
- **Steps:**
  1. Seed user, biolink, y link
  2. Hacer GET a `/:username` (vista)
  3. Hacer GET a `/go/:linkId` (click)
  4. Consultar daily_stats
- **Expected:** 1 registro con `views = 1, clicks = 1`

---

## Notes para Implementación

1. **Import de `data`:** En React Router 7, usar `import { data } from 'react-router'` para retornar response con headers personalizados.

2. **Cookie parsing:** Usar `cookie` npm package o implementar parser simple. El formato es estándar HTTP cookie.

3. **Manejo de errores:** Si el tracking falla (DB error), NO debe bloquear el render de la página. Capturar error y continuar.

4. **Performance:** El tracking agrega una operación de DB al loader. Es aceptable porque:
   - Es una transacción simple (~5ms)
   - Solo ocurre cuando la cookie indica que debe trackear
   - El upsert es eficiente con índices

5. **Cookie size:** Con MAX_ENTRIES=50 y ~45 chars por entry, la cookie max size es ~2KB. Bien dentro del límite de 4KB.
