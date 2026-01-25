# FEATURE_3.3_CLICK_TRACKING.md

## ✅ IMPLEMENTATION STATUS: 100% COMPLETE

**Verificado en producción: Sin fallos ✅**

---

## 1. Natural Language Description

### Current State
- La página pública `/:username` muestra links del usuario
- El componente `PublicLinkCard` renderiza links como `<a href={link.url}>` apuntando directamente a la URL destino
- Las tablas `links.totalClicks` y `daily_link_clicks` existen en el schema pero nunca se incrementan
- No hay forma de trackear cuántas veces se hace click en cada link

### Expected End State
- Cuando un visitante hace click en un link de la página pública, es redirigido a través de `/go/:linkId`
- La ruta `/go/:linkId` incrementa los contadores y luego redirige con HTTP 302 a la URL destino
- Se actualiza `links.totalClicks` (contador acumulativo)
- Se actualiza/inserta `daily_link_clicks` (estadísticas diarias para todos los usuarios)
- Si el linkId no existe, se muestra error 404
- El tracking ocurre de forma transparente - el usuario final llega a la URL destino sin notar la redirección

---

## 2. Technical Description

### High-Level Approach
1. **Crear ruta `/go/:linkId`** que capture todos los clicks en links públicos
2. **Implementar servicio de tracking** con funciones para incrementar contadores
3. **Modificar `PublicLinkCard`** para apuntar a `/go/:linkId` en lugar de la URL directa
4. **Usar transacción** para actualizar ambas tablas (`links` y `daily_link_clicks`) de forma atómica

### Architecture Decisions
- **Redirect 302 (temporal)**: Usamos 302 en lugar de 301 para evitar caching del navegador
- **Tracking siempre activo**: Se guarda `daily_link_clicks` para todos los usuarios (free y premium). Los datos se recolectan pero solo premium podrá verlos en el dashboard
- **Upsert para daily_link_clicks**: Usar `onConflictDoUpdate` para incrementar clicks si ya existe registro del día
- **Error 404 para links inválidos**: Si el linkId no existe, throw Response 404

### Dependencies
- Existentes: `app/db/schema/links.ts`, `app/db/schema/dailyLinkClicks.ts`
- Existentes: `app/services/links.server.ts`
- Modificar: `app/components/public/PublicLinkCard.tsx`

---

## 2.1. Architecture Gate (REQUIRED)

- **Pages are puzzles:** La ruta `go.$linkId.tsx` es mínima - solo llama al servicio y redirige
- **Loaders/actions are thin:** El loader:
  1. Extrae `linkId` del param
  2. Llama a `trackClickAndGetUrl(linkId)`
  3. Retorna redirect 302 a la URL destino (o throw 404)
- **Business logic is not in components:**
  - La lógica de incremento vive en `app/services/links.server.ts`
  - `PublicLinkCard` solo construye el href, sin lógica de tracking

### Route Module Summary
| Route | Services Called | Components Composed |
|-------|-----------------|---------------------|
| `/go/:linkId` | `trackClickAndGetUrl` | Ninguno (redirect puro) |

### Component Summary
| Component | Hooks Used | Business Logic |
|-----------|------------|----------------|
| `PublicLinkCard` (modificado) | Ninguno | NINGUNA - solo cambia href a `/go/:linkId` |

---

## 3. Files to Change/Create

### `app/services/links.server.ts`
**Objective:** Añadir función `trackClickAndGetUrl` que incrementa contadores y retorna la URL destino. También añadir función helper `incrementDailyLinkClick` para el upsert.

**Pseudocode:**
```pseudocode
FUNCTION trackClickAndGetUrl(linkId: string)
  INPUT: linkId (uuid)

  PROCESS:
    BEGIN TRANSACTION
      // 1. Buscar el link y verificar que existe
      link = SELECT id, url, biolinkId FROM links WHERE id = linkId LIMIT 1

      IF link IS null THEN
        RETURN { success: false, error: 'LINK_NOT_FOUND' }
      END IF

      // 2. Incrementar totalClicks en el link
      UPDATE links
      SET totalClicks = totalClicks + 1, updatedAt = NOW()
      WHERE id = linkId

      // 3. Upsert en daily_link_clicks
      today = DATE_TRUNC('day', NOW())

      INSERT INTO daily_link_clicks (linkId, date, clicks)
      VALUES (linkId, today, 1)
      ON CONFLICT (linkId, date) DO UPDATE
      SET clicks = daily_link_clicks.clicks + 1

    COMMIT TRANSACTION

    RETURN { success: true, url: link.url }

  OUTPUT: { success: true, url: string } | { success: false, error: string }
END


FUNCTION incrementDailyLinkClick(tx, linkId: string, date: Date)
  // Helper interno para el upsert de daily_link_clicks
  INPUT: transaction, linkId (uuid), date (Date truncada a día)

  PROCESS:
    INSERT INTO daily_link_clicks (id, linkId, date, clicks)
    VALUES (random_uuid, linkId, date, 1)
    ON CONFLICT (linkId, date) DO UPDATE
    SET clicks = daily_link_clicks.clicks + 1

  OUTPUT: void
END
```

**Notas de implementación:**
- Usar `sql` template literal de Drizzle para `totalClicks + 1`
- Usar `onConflictDoUpdate` de Drizzle para el upsert
- El índice `unique_link_date` ya existe en el schema

---

### `app/routes/go.$linkId.tsx`
**Objective:** Ruta que captura clicks, trackea, y redirige a la URL destino. Solo tiene loader, no tiene UI.

**Pseudocode:**
```pseudocode
LOADER({ params })
  INPUT: params.linkId

  PROCESS:
    linkId = params.linkId

    IF NOT linkId THEN
      THROW Response('Not Found', { status: 404 })
    END IF

    result = await trackClickAndGetUrl(linkId)

    IF NOT result.success THEN
      THROW Response('Not Found', { status: 404 })
    END IF

    // Redirect 302 a la URL destino
    RETURN redirect(result.url, { status: 302 })

  OUTPUT: Redirect 302 | 404

// No hay component - es redirect puro
// No hay action - solo maneja GET
// No hay meta - nunca se renderiza página
```

---

### `app/routes.ts`
**Objective:** Registrar la nueva ruta `/go/:linkId` ANTES de la ruta catch-all `/:username`

**Pseudocode:**
```pseudocode
CURRENT:
  ...
  route('dashboard', 'routes/dashboard.tsx'),
  route(':username', 'routes/public.tsx'),  // catch-all, debe ser última

AFTER:
  ...
  route('dashboard', 'routes/dashboard.tsx'),
  route('go/:linkId', 'routes/go.$linkId.tsx'),  // <-- ADD antes de catch-all
  route(':username', 'routes/public.tsx'),  // catch-all sigue siendo última
```

---

### `app/components/public/PublicLinkCard.tsx`
**Objective:** Modificar el href para apuntar a `/go/:linkId` en lugar de la URL directa. El componente recibe el `link.id` y construye la URL de tracking.

**Pseudocode:**
```pseudocode
COMPONENT PublicLinkCard
  PROPS: link: { id, title, url, emoji }

  PROCESS:
    // ANTES: href = link.url
    // DESPUÉS: href = /go/{link.id}
    trackingUrl = `/go/${link.id}`

  RENDER:
    <a
      href={trackingUrl}  // <-- CAMBIO: usar URL de tracking
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block w-full"
    >
      // Shadow layer (sin cambios)
      <div className="absolute inset-0 bg-dark ..." />

      // Card face (sin cambios)
      <div className="relative z-10 bg-white border-[3px] ...">
        IF link.emoji THEN <span>{link.emoji}</span>
        <span className="font-bold">{link.title}</span>
      </div>
    </a>
```

**Nota:** El resto del JSX permanece igual. Solo cambia la construcción del `href`.

---

## 4. I18N

Esta tarea NO requiere nuevas claves i18n:
- La ruta `/go/:linkId` no renderiza UI (redirect puro)
- El error 404 usa el manejo estándar de errores del navegador
- `PublicLinkCard` no tiene textos traducibles adicionales

---

## 5. E2E Test Plan

### Test 1: Click en link incrementa totalClicks
- **Preconditions:**
  - Usuario "clicktest" existe con biolink
  - Biolink tiene 1 link con `totalClicks = 0`
- **Steps:**
  1. Obtener linkId del link existente
  2. Hacer GET request a `/go/{linkId}`
  3. Consultar DB para verificar `totalClicks`
- **Expected:**
  - Request retorna redirect 302
  - `links.totalClicks` ahora es 1
  - Header `Location` contiene la URL destino del link

### Test 2: Click crea registro en daily_link_clicks
- **Preconditions:**
  - Usuario "dailytest" existe con biolink
  - Biolink tiene 1 link
  - No existe registro en `daily_link_clicks` para hoy
- **Steps:**
  1. Obtener linkId del link existente
  2. Hacer GET request a `/go/{linkId}`
  3. Consultar `daily_link_clicks` para el linkId y fecha de hoy
- **Expected:**
  - Nuevo registro en `daily_link_clicks` con `clicks = 1`
  - `date` es la fecha de hoy (sin componente de hora)

### Test 3: Múltiples clicks incrementan correctamente
- **Preconditions:**
  - Usuario "multiclick" existe con biolink y 1 link
- **Steps:**
  1. Obtener linkId
  2. Hacer 3 GET requests a `/go/{linkId}`
  3. Consultar DB
- **Expected:**
  - `links.totalClicks = 3`
  - `daily_link_clicks.clicks = 3` (un solo registro para hoy)

### Test 4: LinkId inválido retorna 404
- **Preconditions:** Ninguna (no existe el link)
- **Steps:**
  1. Hacer GET request a `/go/00000000-0000-0000-0000-000000000000`
- **Expected:**
  - Response status 404
  - No hay redirect

### Test 5: LinkId malformado retorna 404
- **Preconditions:** Ninguna
- **Steps:**
  1. Hacer GET request a `/go/not-a-valid-uuid`
- **Expected:**
  - Response status 404
  - No hay redirect

### Test 6: PublicLinkCard usa URL de tracking (E2E UI)
- **Preconditions:**
  - Usuario "uitest" existe con biolink
  - Biolink tiene 1 link con id conocido
- **Steps:**
  1. Navegar a `/uitest`
  2. Inspeccionar el href del link card
- **Expected:**
  - El href del `<a>` es `/go/{linkId}`, no la URL directa
  - El link tiene `target="_blank"`

---

## Implementation Notes

### Orden de implementación sugerido
1. Primero: `links.server.ts` - añadir `trackClickAndGetUrl`
2. Segundo: `go.$linkId.tsx` - crear la ruta
3. Tercero: `routes.ts` - registrar la ruta
4. Cuarto: `PublicLinkCard.tsx` - actualizar href
5. Último: Tests E2E

### Consideraciones de performance
- La transacción es ligera (2 updates simples)
- El índice `unique_link_date` asegura upserts rápidos
- No hay validación de auth (ruta pública)

### Fecha para daily_link_clicks
- Usar `sql`DATE_TRUNC('day', NOW())`` para PostgreSQL
- Esto garantiza que todos los clicks del día van al mismo registro
- Ejemplo: clicks a las 10:00, 15:00, y 23:00 del 2024-01-15 → un solo registro con `clicks = 3`
