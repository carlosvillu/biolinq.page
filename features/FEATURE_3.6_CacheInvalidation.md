# FEATURE_3.6_CacheInvalidation.md

## ✅ IMPLEMENTATION STATUS: 100% COMPLETE

**Verificado en producción: Sin fallos ✅**

---

## 1. Natural Language Description

### Current State
- La feature 3.5 implementa caching de páginas públicas con header `Surrogate-Key: biolink-{id}`
- Cloudflare cachea las páginas públicas de usuario por 1 hora (`s-maxage=3600`)
- Cuando un usuario modifica su perfil (links, tema, colores, etc.), la página cacheada queda desactualizada
- No existe mecanismo para invalidar el cache cuando hay cambios

### Expected End State
- Cuando un usuario realiza cambios que afectan su página pública, el cache de Cloudflare se invalida automáticamente
- La invalidación es selectiva usando `Surrogate-Key`, afectando solo la página del usuario que hizo cambios
- Los cambios que disparan invalidación son:
  - Crear, editar o eliminar un link
  - Reordenar links
  - Cambiar tema o colores
  - (Futuro: cambiar nombre, bio, avatar)
- La invalidación es fire-and-forget: no bloquea la respuesta al usuario si falla

---

## 2. Technical Description

### High-Level Approach
1. **Crear servicio `cache.server.ts`** con función `invalidateBiolinkCache(biolinkId)` que llama a la API de Cloudflare
2. **Modificar el action de dashboard.tsx** para llamar al servicio después de cada operación exitosa que modifique el biolink
3. **Configurar variables de entorno** para las credenciales de Cloudflare

### Architecture Decisions
- **Fire-and-forget**: La invalidación no bloquea ni falla la operación principal. Si Cloudflare falla, el cache expirará naturalmente (1h)
- **Servicio centralizado**: Toda la lógica de invalidación en `cache.server.ts` para reutilización futura
- **API Cloudflare v4**: Usar endpoint `purge_cache` con prefijos de Surrogate-Key
- **Variables de entorno**: `CLOUDFLARE_ZONE_ID` y `CLOUDFLARE_API_TOKEN` con permisos mínimos (Cache Purge)

### API de Cloudflare
```
POST https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache
Authorization: Bearer {api_token}
Content-Type: application/json

{
  "prefixes": ["biolink-{biolinkId}"]
}
```

**Nota:** El campo `prefixes` permite purgar todas las URLs que tengan un `Surrogate-Key` que comience con ese prefijo.

### Dependencies
- Nueva: `app/services/cache.server.ts`
- Modificar: `app/routes/dashboard.tsx` (action)
- Nuevas env vars: `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_API_TOKEN`

---

## 2.1. Architecture Gate (REQUIRED)

- **Pages are puzzles:** Sin cambios en UI, solo lógica de action
- **Loaders/actions are thin:**
  - Action de `dashboard.tsx` ya llama a servicios; añadir llamada a `invalidateBiolinkCache` después de cada operación exitosa
- **Business logic is not in components:**
  - Lógica de invalidación en `app/services/cache.server.ts`
  - No hay cambios en componentes

### Route Module Summary
| Route | Services Called (cambios) |
|-------|---------------------------|
| `/dashboard` action | + `invalidateBiolinkCache` después de: `createLink`, `deleteLink`, `reorderLinks`, `updateBiolinkTheme`, `updateBiolinkColors` |

---

## 3. Files to Change/Create

### `app/services/cache.server.ts`
**Objective:** Servicio para invalidar cache de Cloudflare usando Surrogate-Key.

**Pseudocode:**
```pseudocode
CONST CLOUDFLARE_API_URL = "https://api.cloudflare.com/client/v4"

FUNCTION invalidateBiolinkCache(biolinkId: string)
  INPUT: biolinkId (uuid)

  PROCESS:
    zoneId = process.env.CLOUDFLARE_ZONE_ID
    apiToken = process.env.CLOUDFLARE_API_TOKEN

    // Si no hay credenciales, skip silenciosamente (dev mode)
    IF NOT zoneId OR NOT apiToken THEN
      console.warn('[Cache] Cloudflare credentials not configured, skipping invalidation')
      RETURN
    END IF

    surrogateKey = `biolink-${biolinkId}`

    TRY
      response = await fetch(
        `${CLOUDFLARE_API_URL}/zones/${zoneId}/purge_cache`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prefixes: [surrogateKey]
          })
        }
      )

      IF NOT response.ok THEN
        errorBody = await response.text()
        console.error('[Cache] Cloudflare purge failed:', response.status, errorBody)
      ELSE
        console.log('[Cache] Purged cache for:', surrogateKey)
      END IF

    CATCH error
      // Fire-and-forget: log but don't throw
      console.error('[Cache] Error purging cache:', error)
    END TRY

  OUTPUT: void (fire-and-forget, no return value)
END
```

**Notas:**
- Siempre async, nunca bloquea
- Log de errores para debugging pero no falla la operación
- Skip silencioso en desarrollo (sin credenciales)

---

### `app/routes/dashboard.tsx`
**Objective:** Añadir llamadas a `invalidateBiolinkCache` después de operaciones exitosas que modifican el biolink.

**Pseudocode:**
```pseudocode
// AÑADIR import
import { invalidateBiolinkCache } from '~/services/cache.server'

ACTION({ request })
  // ... código existente ...

  IF intent === 'create' THEN
    result = await createLink(...)
    IF result.success THEN
      invalidateBiolinkCache(biolinkId)  // <-- ADD (fire-and-forget, no await)
      RETURN redirect('/dashboard')
    END IF
  END IF

  IF intent === 'delete' THEN
    // Necesitamos el biolinkId del link antes de borrarlo
    // El servicio deleteLink ya valida ownership, pero necesitamos biolinkId para cache
    linkId = formData.get('linkId')
    biolinkId = formData.get('biolinkId')  // <-- ADD: pasar desde el form

    result = await deleteLink(...)
    IF result.success THEN
      invalidateBiolinkCache(biolinkId)  // <-- ADD
      RETURN redirect('/dashboard')
    END IF
  END IF

  IF intent === 'reorder' THEN
    result = await reorderLinks(...)
    IF result.success THEN
      invalidateBiolinkCache(biolinkId)  // <-- ADD
      RETURN redirect('/dashboard')
    END IF
  END IF

  IF intent === 'updateTheme' THEN
    themeResult = await updateBiolinkTheme(...)
    colorsResult = await updateBiolinkColors(...)
    IF themeResult.success AND colorsResult.success THEN
      invalidateBiolinkCache(biolinkId)  // <-- ADD
      RETURN redirect('/dashboard')
    END IF
  END IF

  // Nota: setCustomDomain, removeCustomDomain, verify* no afectan la página pública visible
  // por ahora, pero podrían necesitar invalidación en el futuro
END
```

**Cambios específicos:**
1. AÑADIR import de `invalidateBiolinkCache`
2. AÑADIR `invalidateBiolinkCache(biolinkId)` después de cada operación exitosa
3. Para `intent === 'delete'`: necesitamos que el form envíe `biolinkId` (verificar si ya lo hace)

**Importante:** NO usar `await` en `invalidateBiolinkCache` - es fire-and-forget para no bloquear la respuesta.

---

### `app/components/dashboard/LinksList.tsx` (verificar)
**Objective:** Asegurar que el form de delete envía `biolinkId`.

**Pseudocode:**
```pseudocode
// VERIFICAR que el form de delete incluye biolinkId
// Si no lo incluye, añadir:

<form method="post">
  <input type="hidden" name="intent" value="delete" />
  <input type="hidden" name="linkId" value={link.id} />
  <input type="hidden" name="biolinkId" value={biolinkId} />  // <-- Verificar/añadir
  <button type="submit">Delete</button>
</form>
```

---

### Variables de entorno
**Objective:** Documentar las nuevas variables de entorno requeridas.

**Añadir a `docs/DEPLOYMENT.md`:**
```markdown
### Cache Invalidation (Cloudflare)

- `CLOUDFLARE_ZONE_ID` - Zone ID de tu dominio en Cloudflare (Dashboard > Overview > Zone ID)
- `CLOUDFLARE_API_TOKEN` - API Token con permiso "Cache Purge" (My Profile > API Tokens > Create Token)

**Crear API Token en Cloudflare:**
1. Ir a My Profile > API Tokens
2. Create Token > Custom Token
3. Permissions: Zone > Cache Purge > Purge
4. Zone Resources: Include > Specific Zone > tu-dominio.com
5. Create Token y copiar el valor
```

---

## 4. I18N

Esta tarea NO requiere nuevas claves i18n:
- No hay cambios en UI
- Los logs son solo para debugging del servidor

---

## 5. E2E Test Plan

### Test 1: Servicio de cache no falla sin credenciales
- **Preconditions:**
  - Variables `CLOUDFLARE_ZONE_ID` y `CLOUDFLARE_API_TOKEN` NO configuradas (entorno de test)
- **Steps:**
  1. Llamar a `invalidateBiolinkCache('test-id')` directamente
- **Expected:**
  - La función completa sin error
  - Log de warning indica que se skipped la invalidación

### Test 2: Crear link dispara invalidación (integration mock)
- **Preconditions:**
  - Usuario autenticado con biolink
  - Mock de `fetch` para interceptar llamadas a Cloudflare API
- **Steps:**
  1. Hacer POST a `/dashboard` con intent=create y datos de link válidos
  2. Verificar llamadas a fetch
- **Expected:**
  - Se llamó a fetch con URL de Cloudflare purge_cache
  - Body contiene `prefixes: ["biolink-{biolinkId}"]`

**Nota:** Los tests E2E completos de invalidación requieren un entorno con Cloudflare real o mocks sofisticados. Para esta feature, priorizamos:
1. Test unitario del servicio con credenciales faltantes
2. Verificación manual en producción

### Test 3: Verificación manual en producción
- **Steps:**
  1. Visitar página pública de usuario, verificar que está cacheada (cf-cache-status: HIT)
  2. Desde dashboard, crear/eliminar un link
  3. Visitar página pública nuevamente
- **Expected:**
  - Primera visita después del cambio: cf-cache-status: MISS (cache invalidado)
  - Siguientes visitas: cf-cache-status: HIT (re-cacheado)

---

## Implementation Notes

### Orden de implementación sugerido
1. Primero: Configurar variables de entorno en Netlify/producción
2. Segundo: `cache.server.ts` - crear servicio
3. Tercero: `dashboard.tsx` - integrar invalidación
4. Cuarto: Verificar que forms envían biolinkId donde necesario
5. Quinto: Actualizar `docs/DEPLOYMENT.md`
6. Último: Verificación manual en producción

### Permisos mínimos del API Token
El token de Cloudflare solo necesita:
- **Permission:** Zone > Cache Purge > Purge
- **Zone Resources:** Específico al dominio de producción

No dar permisos adicionales (DNS, SSL, etc.) por seguridad.

### Consideraciones de rate limiting
- Cloudflare permite 1000 purge requests por día en el plan gratuito
- Cada operación del dashboard = 1 purge request
- Para usuarios muy activos, considerar debouncing en el futuro (fuera de scope)

### Fallback natural
Si la invalidación falla por cualquier razón:
- El cache expira naturalmente después de 1 hora (s-maxage=3600)
- El usuario verá cambios eventualmente
- No hay impacto en la funcionalidad core
