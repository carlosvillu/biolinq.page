# FEATURE_1.2_UsernameService.md

## 1. Natural Language Description

### Current State
El proyecto tiene el schema de base de datos creado con la tabla `biolinks` que incluye un campo `username` único con índice. Existe una constante `RESERVED_USERNAMES` y una función `isReservedUsername()` en `app/lib/constants.ts`. Sin embargo, no hay lógica de servicio para verificar disponibilidad de usernames ni para registrar nuevos biolinks.

### Expected End State
Existirá un servicio `app/services/username.server.ts` que:
1. Verifica si un username está disponible (no reservado, no tomado)
2. Registra un username creando el biolink asociado al usuario
3. Maneja errores específicos: `USERNAME_TAKEN`, `USERNAME_RESERVED`, `USER_ALREADY_HAS_BIOLINK`

Además, existirá un endpoint de test `/api/__test__/username` que permite probar el servicio sin UI, accesible solo cuando `DB_TEST_URL` está definido.

---

## 2. Technical Description

### Approach
- Crear un servicio server-side con dos funciones principales
- `checkUsernameAvailability`: consulta la DB y la lista de reservados
- `registerUsername`: crea un biolink con transacción para evitar race conditions
- El endpoint de test sigue el patrón existente en faviconforge

### Dependencies
- Drizzle ORM (`app/db`)
- Schema `biolinks` (`app/db/schema/biolinks.ts`)
- Constantes `isReservedUsername` (`app/lib/constants.ts`)

### Error Handling
El servicio usa un patrón de Result type para errores predecibles:
- `USERNAME_TAKEN`: el username ya existe en la DB
- `USERNAME_RESERVED`: el username está en la lista de reservados
- `USER_ALREADY_HAS_BIOLINK`: el usuario ya tiene un biolink

---

## 2.1. Architecture Gate

- **Pages are puzzles:** El endpoint de test es una API route sin UI, solo parsea request y llama al servicio.
- **Loaders/actions are thin:** El loader/action del endpoint solo valida input y delega al servicio.
- **Business logic is not in components:** Toda la lógica de username está en `app/services/username.server.ts`.

### Route Module → Service Mapping
- `app/routes/api.__test__.username.tsx`:
  - **loader**: parsea `?username=xxx`, llama a `checkUsernameAvailability()`
  - **action**: parsea body JSON, llama a `registerUsername()`

---

## 3. Files to Change/Create

### `app/services/username.server.ts`
**Objective:** Servicio con lógica de negocio para verificar disponibilidad y registrar usernames.

**Pseudocode:**
```pseudocode
IMPORT db, biolinks schema, isReservedUsername

TYPE UsernameError = 'USERNAME_TAKEN' | 'USERNAME_RESERVED' | 'USER_ALREADY_HAS_BIOLINK'

TYPE CheckResult = { available: true } | { available: false, reason: UsernameError }

FUNCTION checkUsernameAvailability(username: string): Promise<CheckResult>
  INPUT: username (lowercase, trimmed by caller)
  
  IF isReservedUsername(username)
    RETURN { available: false, reason: 'USERNAME_RESERVED' }
  END
  
  existingBiolink = SELECT FROM biolinks WHERE username = username LIMIT 1
  
  IF existingBiolink exists
    RETURN { available: false, reason: 'USERNAME_TAKEN' }
  END
  
  RETURN { available: true }
END

TYPE RegisterResult = 
  | { success: true, biolink: Biolink }
  | { success: false, error: UsernameError }

FUNCTION registerUsername(userId: string, username: string): Promise<RegisterResult>
  INPUT: userId (UUID), username (lowercase, trimmed)
  
  // Check if user already has a biolink
  existingUserBiolink = SELECT FROM biolinks WHERE user_id = userId LIMIT 1
  
  IF existingUserBiolink exists
    RETURN { success: false, error: 'USER_ALREADY_HAS_BIOLINK' }
  END
  
  // Check availability (reuse function)
  availabilityCheck = checkUsernameAvailability(username)
  
  IF NOT availabilityCheck.available
    RETURN { success: false, error: availabilityCheck.reason }
  END
  
  // Insert biolink
  TRY
    newBiolink = INSERT INTO biolinks (user_id, username) VALUES (userId, username) RETURNING *
    RETURN { success: true, biolink: newBiolink }
  CATCH unique constraint error
    // Race condition: username was taken between check and insert
    RETURN { success: false, error: 'USERNAME_TAKEN' }
  END
END
```

---

### `app/routes/api.__test__.username.tsx`
**Objective:** Endpoint de test para probar el servicio sin UI. Solo accesible si `DB_TEST_URL` existe.

**Pseudocode:**
```pseudocode
IMPORT checkUsernameAvailability, registerUsername from username.server
IMPORT z from zod

registerSchema = z.object({
  userId: z.string().uuid(),
  username: z.string()
})

LOADER (request):
  IF NOT process.env.DB_TEST_URL
    THROW 404 Not Found
  END
  
  url = parse request.url
  username = url.searchParams.get('username')
  
  IF NOT username
    THROW 400 'username query param is required'
  END
  
  result = await checkUsernameAvailability(username.toLowerCase().trim())
  
  RETURN JSON response with result
END

ACTION (request):
  IF request.method !== 'POST'
    THROW 405 Method Not Allowed
  END
  
  IF NOT process.env.DB_TEST_URL
    THROW 404 Not Found
  END
  
  body = await request.json()
  parsed = registerSchema.safeParse(body)
  
  IF NOT parsed.success
    THROW 400 'Invalid request body'
  END
  
  result = await registerUsername(parsed.data.userId, parsed.data.username.toLowerCase().trim())
  
  RETURN JSON response with result
END
```

---

### `app/routes.ts`
**Objective:** Registrar la nueva ruta de test API.

**Pseudocode:**
```pseudocode
// Add new route
route('api/__test__/username', 'routes/api.__test__.username.tsx')
```

---

## 4. I18N

No aplica para esta tarea. El servicio es backend-only y el endpoint de test no tiene UI.

---

## 5. E2E Test Plan

### Test: Check availability returns true for valid username
- **Preconditions:** DB vacía (sin biolinks), `DB_TEST_URL` configurado
- **Steps:** 
  1. GET `/api/__test__/username?username=validuser`
- **Expected:** Response `{ available: true }`

### Test: Check availability returns false for reserved username
- **Preconditions:** `DB_TEST_URL` configurado
- **Steps:**
  1. GET `/api/__test__/username?username=admin`
- **Expected:** Response `{ available: false, reason: 'USERNAME_RESERVED' }`

### Test: Check availability returns false for taken username
- **Preconditions:** Existe un biolink con username "takenuser"
- **Steps:**
  1. POST `/api/__test__/username` con `{ userId: <uuid>, username: 'takenuser' }` (crear primero)
  2. GET `/api/__test__/username?username=takenuser`
- **Expected:** Response `{ available: false, reason: 'USERNAME_TAKEN' }`

### Test: Register username creates biolink successfully
- **Preconditions:** Usuario existe en DB, no tiene biolink
- **Steps:**
  1. POST `/api/__test__/username` con `{ userId: <user-uuid>, username: 'newuser' }`
- **Expected:** Response `{ success: true, biolink: { id, userId, username: 'newuser', ... } }`

### Test: Register username fails for reserved username
- **Preconditions:** Usuario existe en DB
- **Steps:**
  1. POST `/api/__test__/username` con `{ userId: <user-uuid>, username: 'dashboard' }`
- **Expected:** Response `{ success: false, error: 'USERNAME_RESERVED' }`

### Test: Register username fails if user already has biolink
- **Preconditions:** Usuario existe y ya tiene un biolink
- **Steps:**
  1. POST `/api/__test__/username` con `{ userId: <same-user-uuid>, username: 'anotheruser' }`
- **Expected:** Response `{ success: false, error: 'USER_ALREADY_HAS_BIOLINK' }`

### Test: Endpoint returns 404 when DB_TEST_URL is not set
- **Preconditions:** `DB_TEST_URL` no está configurado (producción)
- **Steps:**
  1. GET `/api/__test__/username?username=test`
- **Expected:** Response 404 Not Found

---

## 6. Notes

- El índice en `biolinks.username` ya existe en el schema (Task 0.2 completada)
- La función `isReservedUsername()` ya existe en `app/lib/constants.ts`
- La validación de formato (3-20 chars, alphanumeric + hyphens) se hace en Zod en Task 1.1, el servicio asume input ya validado
