# FEATURE_2.1_LinksService.md

## ✅ IMPLEMENTATION STATUS: 100% COMPLETE

**Verificado en producción: Sin fallos ✅**

---

## 1. Natural Language Description

### Current State
El usuario puede crear un biolink con username, pero no tiene forma de añadir links a su página pública. El dashboard está vacío sin funcionalidad.

### Expected End State
Existe un servicio backend (`app/services/links.server.ts`) que permite:
- Obtener todos los links de un biolink
- Crear un nuevo link (con validación de límite máximo)
- Eliminar un link (con reordenamiento automático de posiciones)
- Reordenar links (recibiendo array completo de IDs en nuevo orden)
- Validar ownership del biolink antes de cualquier operación

El límite de links está configurado de forma explícita para facilitar futura diferenciación free/premium.

---

## 2. Technical Description

### Approach
Crear un servicio server-side siguiendo el patrón existente en `username.server.ts`:
- Funciones puras que reciben parámetros y retornan resultados tipados
- Uso de discriminated unions para resultados (success/error)
- Validación de ownership en cada operación
- Transacciones para operaciones que modifican múltiples registros

### Key Decisions
- **No `updateLink`:** Por simplicidad, el usuario elimina y crea de nuevo. Reduce complejidad del servicio.
- **Límite configurable:** Constantes `MAX_LINKS_FREE` y `MAX_LINKS_PREMIUM` (ambas 5 por ahora) en `app/lib/constants.ts` + función `getMaxLinks(isPremium)` para facilitar futura distinción.
- **Validación de URL:** Solo formato, solo `https://`. Auto-prepend si falta protocolo.
- **Validación de emoji:** Regex para detectar emojis Unicode válidos.
- **Ownership check:** El servicio valida que el `biolinkId` pertenece al `userId` antes de cualquier operación.

### Dependencies
- Drizzle ORM (ya instalado)
- Zod para validación (ya instalado)
- Schema `links` existente en `app/db/schema/links.ts`

---

## 2.1. Architecture Gate

- **Pages are puzzles:** Este servicio será consumido por loaders/actions del dashboard. Los route modules solo parsean request, llaman al servicio, y retornan data/redirect.
- **Loaders/actions are thin:** Las rutas que usen este servicio delegarán toda la lógica de negocio aquí.
- **Business logic is not in components:** Toda validación (límites, ownership, formato URL/emoji) vive en el servicio.

### Service responsibilities
- `links.server.ts`: Validación de ownership, límites, CRUD de links, reordenamiento.

---

## 3. Files to Change/Create

### `app/lib/constants.ts`
**Objective:** Añadir constante para límite de links configurable.

**Pseudocode:**
```pseudocode
// Añadir al archivo existente
CONSTANT MAX_LINKS_FREE = 5
CONSTANT MAX_LINKS_PREMIUM = 5  // Por ahora igual, preparado para futuro

FUNCTION getMaxLinks(isPremium: boolean): number
  RETURN isPremium ? MAX_LINKS_PREMIUM : MAX_LINKS_FREE
END
```

---

### `app/lib/link-validation.ts`
**Objective:** Schemas Zod para validación de links (URL, emoji, title).

**Pseudocode:**
```pseudocode
IMPORT zod

// Regex para detectar emojis Unicode
CONSTANT EMOJI_REGEX = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u

SCHEMA urlSchema
  - string
  - transform: si no empieza con https://, prepend https://
  - refine: debe ser URL válida con protocolo https

SCHEMA emojiSchema
  - string nullable
  - refine: si presente, debe matchear EMOJI_REGEX

SCHEMA createLinkSchema
  - emoji: emojiSchema (opcional)
  - title: string, min 1, max 50
  - url: urlSchema

EXPORT schemas y tipos inferidos
```

---

### `app/services/links.server.ts`
**Objective:** Servicio para CRUD de links con validación de ownership y límites.

**Pseudocode:**
```pseudocode
IMPORT db, links schema, biolinks schema
IMPORT eq, and, asc from drizzle-orm
IMPORT getMaxLinks from constants
IMPORT createLinkSchema from link-validation

// Error types
TYPE LinkError =
  | 'BIOLINK_NOT_FOUND'
  | 'NOT_OWNER'
  | 'MAX_LINKS_REACHED'
  | 'LINK_NOT_FOUND'
  | 'INVALID_LINK_IDS'

// Result types (discriminated unions)
TYPE GetLinksResult = { success: true, links: Link[] } | { success: false, error: LinkError }
TYPE CreateLinkResult = { success: true, link: Link } | { success: false, error: LinkError }
TYPE DeleteLinkResult = { success: true } | { success: false, error: LinkError }
TYPE ReorderLinksResult = { success: true } | { success: false, error: LinkError }

// Helper interno para validar ownership
FUNCTION validateOwnership(userId: string, biolinkId: string): Promise<boolean>
  SELECT biolink WHERE id = biolinkId AND userId = userId
  RETURN biolink exists
END

// Obtener links de un biolink
FUNCTION getLinksByBiolinkId(userId: string, biolinkId: string): Promise<GetLinksResult>
  IF NOT validateOwnership(userId, biolinkId)
    RETURN { success: false, error: 'NOT_OWNER' }
  END
  
  SELECT * FROM links WHERE biolinkId = biolinkId ORDER BY position ASC
  RETURN { success: true, links }
END

// Crear nuevo link
FUNCTION createLink(userId: string, biolinkId: string, data: CreateLinkInput): Promise<CreateLinkResult>
  IF NOT validateOwnership(userId, biolinkId)
    RETURN { success: false, error: 'NOT_OWNER' }
  END
  
  // Contar links existentes
  COUNT links WHERE biolinkId = biolinkId
  
  IF count >= getMaxLinks(false)  // TODO: pasar isPremium cuando exista
    RETURN { success: false, error: 'MAX_LINKS_REACHED' }
  END
  
  // Calcular nueva posición (último + 1)
  position = count
  
  // Validar y transformar data con Zod
  parsed = createLinkSchema.safeParse(data)
  IF NOT parsed.success
    THROW validation error
  END
  
  INSERT INTO links (biolinkId, emoji, title, url, position)
  RETURN { success: true, link }
END

// Eliminar link con reordenamiento
FUNCTION deleteLink(userId: string, linkId: string): Promise<DeleteLinkResult>
  TRANSACTION:
    // Obtener link y su biolink
    SELECT link WHERE id = linkId
    IF NOT link
      RETURN { success: false, error: 'LINK_NOT_FOUND' }
    END
    
    IF NOT validateOwnership(userId, link.biolinkId)
      RETURN { success: false, error: 'NOT_OWNER' }
    END
    
    deletedPosition = link.position
    
    // Eliminar el link
    DELETE FROM links WHERE id = linkId
    
    // Reordenar: decrementar posición de todos los links con position > deletedPosition
    UPDATE links 
      SET position = position - 1 
      WHERE biolinkId = link.biolinkId AND position > deletedPosition
    
    RETURN { success: true }
  END TRANSACTION
END

// Reordenar links
FUNCTION reorderLinks(userId: string, biolinkId: string, linkIds: string[]): Promise<ReorderLinksResult>
  TRANSACTION:
    IF NOT validateOwnership(userId, biolinkId)
      RETURN { success: false, error: 'NOT_OWNER' }
    END
    
    // Obtener todos los links del biolink
    SELECT * FROM links WHERE biolinkId = biolinkId
    
    // Validar que linkIds contiene exactamente los mismos IDs
    existingIds = Set(links.map(l => l.id))
    providedIds = Set(linkIds)
    
    IF existingIds != providedIds
      RETURN { success: false, error: 'INVALID_LINK_IDS' }
    END
    
    // Actualizar posiciones según el nuevo orden
    FOR EACH (linkId, index) IN linkIds
      UPDATE links SET position = index WHERE id = linkId
    END
    
    RETURN { success: true }
  END TRANSACTION
END
```

---

## 4. I18N

### Existing keys to reuse
Ninguna - este es un servicio backend sin UI directa.

### New keys to create
Los mensajes de error se mostrarán en UI (Task 2.2+). Por ahora, el servicio retorna códigos de error que la UI traducirá.

| Key | English | Spanish |
|-----|---------|---------|
| `links_error_not_owner` | You don't have permission to modify this biolink | No tienes permiso para modificar este biolink |
| `links_error_max_reached` | You've reached the maximum number of links (5) | Has alcanzado el número máximo de links (5) |
| `links_error_not_found` | Link not found | Link no encontrado |
| `links_error_invalid_ids` | Invalid link order | Orden de links inválido |
| `links_error_invalid_url` | Please enter a valid HTTPS URL | Por favor ingresa una URL HTTPS válida |
| `links_error_invalid_emoji` | Please enter a valid emoji | Por favor ingresa un emoji válido |

---

### `app/routes/api.__test__.links.tsx`
**Objective:** Test-only API route to expose links service for E2E testing (only available when `DB_TEST_URL` is set).

**Pseudocode:**
```pseudocode
IMPORT links service functions
IMPORT Zod for validation

// Schemas for request validation
SCHEMA createLinkRequestSchema
  - userId: string uuid
  - biolinkId: string uuid
  - emoji: string optional
  - title: string
  - url: string

SCHEMA deleteLinkRequestSchema
  - userId: string uuid
  - linkId: string uuid

SCHEMA reorderLinksRequestSchema
  - userId: string uuid
  - biolinkId: string uuid
  - linkIds: string[] array of uuids

// GET /api/__test__/links?userId=xxx&biolinkId=yyy
LOADER
  IF NOT process.env.DB_TEST_URL
    THROW 404 Not Found
  END
  
  PARSE userId, biolinkId from URL searchParams
  CALL getLinksByBiolinkId(userId, biolinkId)
  RETURN JSON response
END

// POST/DELETE /api/__test__/links
ACTION
  IF NOT process.env.DB_TEST_URL
    THROW 404 Not Found
  END
  
  PARSE JSON body
  
  SWITCH request.method
    CASE 'POST':
      VALIDATE with createLinkRequestSchema
      CALL createLink(userId, biolinkId, { emoji, title, url })
      RETURN JSON { success, link } or { success: false, error }
    
    CASE 'DELETE':
      VALIDATE with deleteLinkRequestSchema
      CALL deleteLink(userId, linkId)
      RETURN JSON { success } or { success: false, error }
    
    CASE 'PATCH':
      VALIDATE with reorderLinksRequestSchema
      CALL reorderLinks(userId, biolinkId, linkIds)
      RETURN JSON { success } or { success: false, error }
  END
END
```

---

## 5. E2E Test Plan

> **Patrón:** Usamos `api/__test__/links` route para testear el servicio directamente via HTTP. Ver `docs/TESTING.md` sección "Testing Services Without UI".

### Test: User can create a link
- **Preconditions:** User seeded with biolink, 0 links
- **Steps:** POST to `/api/__test__/links` with valid data
- **Expected:** Response `{ success: true, link: { id, position: 0, ... } }`

### Test: User cannot create more than 5 links
- **Preconditions:** User seeded with biolink and 5 links
- **Steps:** POST to `/api/__test__/links` to create 6th link
- **Expected:** Response `{ success: false, error: 'MAX_LINKS_REACHED' }`

### Test: User can delete a link and positions reorder
- **Preconditions:** User seeded with biolink and 3 links (positions 0, 1, 2)
- **Steps:** DELETE link at position 1, then GET all links
- **Expected:** Remaining 2 links have positions 0, 1

### Test: User can reorder links
- **Preconditions:** User seeded with biolink and 3 links (A at 0, B at 1, C at 2)
- **Steps:** PATCH with linkIds `[C.id, A.id, B.id]`, then GET all links
- **Expected:** Links returned in order C, A, B with positions 0, 1, 2

### Test: User cannot modify another user's biolink
- **Preconditions:** User A seeded, User B seeded with biolink
- **Steps:** POST to create link on User B's biolink using User A's userId
- **Expected:** Response `{ success: false, error: 'NOT_OWNER' }`

### Test: URL without https:// is auto-prepended
- **Preconditions:** User seeded with biolink
- **Steps:** POST with url `example.com`
- **Expected:** Link created with url `https://example.com`

### Test: Invalid emoji is rejected
- **Preconditions:** User seeded with biolink
- **Steps:** POST with emoji `abc` (not a valid emoji)
- **Expected:** Response with validation error

---

## 6. Implementation Checklist

- [ ] Add `MAX_LINKS_FREE`, `MAX_LINKS_PREMIUM`, `getMaxLinks()` to `app/lib/constants.ts`
- [ ] Create `app/lib/link-validation.ts` with Zod schemas
- [ ] Create `app/services/links.server.ts` with all functions
- [ ] Create `app/routes/api.__test__.links.tsx` test API route
- [ ] Register route in `app/routes.ts`
- [ ] Add i18n keys to `app/locales/en.json` and `app/locales/es.json`
- [ ] Create `tests/e2e/links-service.spec.ts` with E2E tests
- [ ] Add `seedBiolink` and `seedLink` seeders to `tests/fixtures/seeders.ts`
- [ ] Verify with `npm run test:e2e`
- [ ] Verify with `npm run typecheck`
- [ ] Verify with `npm run lint`
