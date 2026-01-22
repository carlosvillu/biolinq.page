# FEATURE_3.5_PublicPageCaching.md

## 1. Natural Language Description

### Current State
- La página pública `/:username` realiza tracking de vistas desde el **server-side loader**
- El loader ejecuta `trackView(biolinkId)` y añade un header `Set-Cookie` para evitar conteo duplicado
- El header `Set-Cookie` **impide que Cloudflare cachee la respuesta** (comportamiento por defecto de CDNs)
- Cada visita genera una request al origen (Netlify), sin beneficio del CDN
- Los headers de respuesta muestran `cf-cache-status: MISS` y `cache-status: fwd=bypass`

### Expected End State
- Las páginas públicas de usuario se cachean en el edge de Cloudflare
- El tracking de vistas se realiza **client-side** mediante un endpoint API que no bloquea el render
- El loader de `public.tsx` no envía `Set-Cookie`, permitiendo caching
- Se añaden headers `Cache-Control` apropiados para el edge caching
- Se añade header `Surrogate-Key` para permitir invalidación selectiva cuando el usuario actualiza su perfil
- El endpoint de tracking usa un nombre "inocuo" que no será bloqueado por adblockers

---

## 2. Technical Description

### High-Level Approach
1. **Crear endpoint API `/api/px`** - Nombre corto e inocuo (simula "pixel" de tracking) que no contiene palabras como "track", "view", "analytics", etc.
2. **Mover tracking a client-side** - El componente `PublicProfile` llamará al endpoint via `fetch()` después del render inicial
3. **Eliminar tracking y cookies del loader** - El loader de `public.tsx` solo cargará datos, sin side-effects
4. **Añadir headers de cache** - El loader enviará `Cache-Control` y `Surrogate-Key` para Cloudflare
5. **Implementar hook `usePageView`** - Encapsula la lógica de tracking client-side con debounce y deduplicación

### Architecture Decisions
- **Nombre del endpoint `/api/px`**: "px" es común en tracking (pixel), pero no está en listas negras de adblockers. Alternativas consideradas: `/api/sig`, `/api/beacon`, `/api/evt`. Se elige `px` por ser corto y no descriptivo.
- **POST en lugar de GET**: El endpoint usará POST para evitar caching accidental y ser más semántico
- **Deduplicación client-side**: Usaremos `sessionStorage` para evitar múltiples conteos en la misma sesión del navegador
- **Cache TTL**: `s-maxage=3600` (1 hora en CDN), `max-age=60` (1 minuto en browser). El contenido de perfiles no cambia frecuentemente.
- **Surrogate-Key**: Formato `biolink-{biolinkId}` para invalidación granular

### Dependencies
- Existentes: `app/services/views.server.ts` (reusar `trackView`)
- Existentes: `app/routes/public.tsx`
- Existentes: `app/components/public/PublicProfile.tsx`
- Eliminar dependencia: `app/lib/view-cookie.server.ts` (ya no necesario para esta ruta)

---

## 2.1. Architecture Gate (REQUIRED)

- **Pages are puzzles:**
  - `public.tsx` solo compone `PublicProfile`, sin lógica de tracking
  - `api.px.tsx` no tiene UI, solo action
- **Loaders/actions are thin:**
  - Loader de `public.tsx`: extrae username, llama servicio, retorna data con headers
  - Action de `api.px.tsx`: extrae biolinkId del body, llama `trackView`, retorna JSON
- **Business logic is not in components:**
  - Lógica de tracking en `app/services/views.server.ts` (existente)
  - Orquestación de tracking client-side en `app/hooks/usePageView.ts`
  - `PublicProfile` solo consume el hook, sin lógica de negocio

### Route Module Summary
| Route | Services Called | Components Composed |
|-------|-----------------|---------------------|
| `/:username` | `getBiolinkWithUserByUsername`, `getPublicLinksByBiolinkId` | `PublicProfile`, `PublicNotFound`, `PublicError` |
| `/api/px` | `trackView` | Ninguno (API pura) |

### Component Summary
| Component | Hooks Used | Business Logic |
|-----------|------------|----------------|
| `PublicProfile` | `usePageView` | NINGUNA - delega al hook |

---

## 3. Files to Change/Create

### `app/routes/api.px.tsx`
**Objective:** Endpoint POST para tracking de vistas. Nombre inocuo para evitar bloqueo por adblockers.

**Pseudocode:**
```pseudocode
ACTION({ request })
  INPUT: request con body JSON { id: string }

  PROCESS:
    IF request.method !== 'POST' THEN
      RETURN json({ ok: false }, { status: 405 })
    END IF

    TRY
      body = await request.json()
      biolinkId = body.id

      IF NOT biolinkId OR NOT isValidUUID(biolinkId) THEN
        RETURN json({ ok: false }, { status: 400 })
      END IF

      await trackView(biolinkId)
      RETURN json({ ok: true })
    CATCH
      // Tracking failure should not return error to client
      RETURN json({ ok: true })
    END TRY

  OUTPUT: { ok: boolean }
END
```

**Notas:**
- No hay loader (solo acepta POST)
- Siempre retorna `{ ok: true }` incluso si falla internamente (fire-and-forget semántica)
- Validación de UUID para prevenir abuse

---

### `app/routes.ts`
**Objective:** Registrar la nueva ruta `/api/px`

**Pseudocode:**
```pseudocode
CURRENT:
  route('api/username/check', ...),
  route('api/username/claim', ...),
  ...

AFTER:
  route('api/username/check', ...),
  route('api/username/claim', ...),
  route('api/px', 'routes/api.px.tsx'),  // <-- ADD
  ...
```

---

### `app/hooks/usePageView.ts`
**Objective:** Hook que maneja el tracking de vistas client-side con deduplicación por sesión.

**Pseudocode:**
```pseudocode
HOOK usePageView(biolinkId: string, isPreview: boolean)
  STATE: none (stateless, fire-and-forget)

  EFFECT (runs once on mount):
    IF isPreview THEN
      RETURN // No trackear previews
    END IF

    // Deduplicación por sesión
    storageKey = `pv_${biolinkId}`
    IF sessionStorage.getItem(storageKey) THEN
      RETURN // Ya trackeado en esta sesión
    END IF

    // Marcar como trackeado
    sessionStorage.setItem(storageKey, '1')

    // Fire-and-forget tracking
    fetch('/api/px', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: biolinkId }),
      keepalive: true  // Asegura que se envíe incluso si el usuario navega
    }).catch(() => {
      // Silently ignore errors
    })

  DEPENDENCIES: [biolinkId, isPreview]

  OUTPUT: void (no return value)
END
```

**Notas:**
- `keepalive: true` asegura que el request se complete incluso si el usuario cierra la pestaña
- `sessionStorage` se limpia al cerrar el navegador, permitiendo nuevo conteo en visitas futuras
- No usa cookies, evitando problemas con consent banners

---

### `app/routes/public.tsx`
**Objective:** Eliminar tracking server-side, añadir headers de cache, pasar biolinkId al componente.

**Pseudocode:**
```pseudocode
LOADER({ params, request })
  INPUT: params.username, request

  PROCESS:
    username = params.username

    IF NOT username THEN
      THROW Response('Not Found', { status: 404 })
    END IF

    result = await getBiolinkWithUserByUsername(username)

    IF NOT result THEN
      THROW Response('Not Found', { status: 404 })
    END IF

    url = new URL(request.url)
    isPreview = url.searchParams.get('preview') === '1'

    links = await getPublicLinksByBiolinkId(result.biolink.id)

    // ELIMINADO: tracking y cookies
    // NUEVO: headers de cache
    headers = new Headers()

    IF NOT isPreview THEN
      // Cache en CDN por 1 hora, browser por 1 minuto
      headers.set('Cache-Control', 'public, max-age=60, s-maxage=3600')
      // Surrogate key para invalidación selectiva
      headers.set('Surrogate-Key', `biolink-${result.biolink.id}`)
    ELSE
      // No cachear previews
      headers.set('Cache-Control', 'no-store')
    END IF

    RETURN data({
      biolink: result.biolink,
      user: result.user,
      links,
      isPreview,
    }, { headers })

  OUTPUT: { biolink, user, links, isPreview } con headers de cache
END

COMPONENT PublicPage
  RENDER:
    <PublicProfile
      user={data.user}
      biolink={data.biolink}
      links={data.links}
      isPreview={data.isPreview}
    />
END
```

**Cambios específicos:**
- ELIMINAR: imports de `parseViewCookie`, `shouldTrackView`, `updateViewCookie`, `trackView`
- ELIMINAR: toda la lógica de cookies y tracking
- AÑADIR: headers `Cache-Control` y `Surrogate-Key`

---

### `app/components/public/PublicProfile.tsx`
**Objective:** Integrar el hook `usePageView` para tracking client-side.

**Pseudocode:**
```pseudocode
COMPONENT PublicProfile
  PROPS: user, biolink, links, isPreview

  HOOKS:
    usePageView(biolink.id, isPreview)  // <-- ADD

  RENDER:
    // Sin cambios en el JSX
    // El resto del componente permanece igual
END
```

**Cambios específicos:**
- AÑADIR: import de `usePageView`
- AÑADIR: llamada a `usePageView(biolink.id, isPreview)` al inicio del componente
- Sin cambios en el JSX

---

## 4. I18N

Esta tarea NO requiere nuevas claves i18n:
- El endpoint `/api/px` no tiene UI
- No hay mensajes de error visibles al usuario relacionados con tracking
- Los headers de cache no afectan textos

---

## 5. E2E Test Plan

### Test 1: Página pública tiene headers de cache
- **Preconditions:**
  - Usuario "cachetest" existe con biolink
- **Steps:**
  1. Hacer GET request a `/cachetest`
  2. Inspeccionar headers de respuesta
- **Expected:**
  - Header `Cache-Control` contiene `s-maxage=3600`
  - Header `Cache-Control` contiene `max-age=60`
  - Header `Surrogate-Key` contiene `biolink-{biolinkId}`

### Test 2: Página en modo preview NO tiene cache
- **Preconditions:**
  - Usuario "previewtest" existe con biolink
- **Steps:**
  1. Hacer GET request a `/previewtest?preview=1`
  2. Inspeccionar headers de respuesta
- **Expected:**
  - Header `Cache-Control` es `no-store`
  - NO hay header `Surrogate-Key`

### Test 3: Endpoint /api/px incrementa vistas
- **Preconditions:**
  - Usuario "pxtest" existe con biolink con `totalViews = 0`
- **Steps:**
  1. Obtener biolinkId
  2. Hacer POST a `/api/px` con body `{ "id": "{biolinkId}" }`
  3. Consultar DB para verificar `totalViews`
- **Expected:**
  - Response status 200
  - Response body `{ "ok": true }`
  - `biolinks.totalViews` ahora es 1

### Test 4: Endpoint /api/px rechaza GET
- **Preconditions:** Ninguna
- **Steps:**
  1. Hacer GET request a `/api/px`
- **Expected:**
  - Response status 405

### Test 5: Endpoint /api/px valida UUID
- **Preconditions:** Ninguna
- **Steps:**
  1. Hacer POST a `/api/px` con body `{ "id": "invalid" }`
- **Expected:**
  - Response status 400

### Test 6: Página pública NO tiene Set-Cookie para tracking
- **Preconditions:**
  - Usuario "nocookietest" existe con biolink
- **Steps:**
  1. Hacer GET request a `/nocookietest` (sin cookies previas)
  2. Inspeccionar headers de respuesta
- **Expected:**
  - NO hay header `Set-Cookie` con nombre `_blv`

---

## Implementation Notes

### Orden de implementación sugerido
1. Primero: `api.px.tsx` - crear endpoint de tracking
2. Segundo: `routes.ts` - registrar la ruta
3. Tercero: `usePageView.ts` - crear hook client-side
4. Cuarto: `public.tsx` - eliminar tracking server-side, añadir headers
5. Quinto: `PublicProfile.tsx` - integrar hook
6. Último: Tests E2E

### Invalidación de cache (consideración futura)
Cuando el usuario actualiza su perfil (nombre, bio, avatar, links), se debería:
1. Llamar a la API de Cloudflare para purgar `Surrogate-Key: biolink-{biolinkId}`
2. Esto está fuera del alcance de esta feature pero el header está preparado

### Compatibilidad con adblockers
El nombre `/api/px` fue elegido por:
- No contiene palabras bloqueadas: "track", "view", "analytics", "beacon", "hit", "stat", "metric"
- "px" es ambiguo (podría ser "pixel" pero también "prefix", "proxy", etc.)
- La ruta está bajo `/api/` que raramente se bloquea completamente
- El body JSON `{ id }` no tiene campos sospechosos

### Migración de datos
- La cookie `_blv` existente quedará huérfana pero expirará naturalmente (maxAge: 24h)
- No se requiere migración de datos de tracking existentes
- El archivo `app/lib/view-cookie.server.ts` puede eliminarse si no tiene otros usos
