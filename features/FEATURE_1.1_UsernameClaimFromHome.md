# FEATURE_1.1_UsernameClaimFromHome.md

## ✅ IMPLEMENTATION STATUS: 100% COMPLETE

**Verificado en producción: Sin fallos ✅**

---

## 1. Natural Language Description

### Current State

El `BioLinqHero` en la home tiene un input de username decorativo que no hace nada funcional. El botón "Create my BioLink" simplemente redirige a `/auth/login`. No hay validación de username ni check de disponibilidad.

El servicio `username.server.ts` ya existe con:
- `checkUsernameAvailability(username)` - verifica si está disponible
- `registerUsername(userId, username)` - crea el biolink

### Expected End State

El flujo de claim de username se hace **completamente desde la home**:

1. Usuario escribe username en el input del Hero
2. Al pulsar el botón "Claim":
   - **Si el username es inválido** → mostrar error de validación
   - **Si el username no está disponible** → mostrar error
   - **Si está disponible y usuario es anónimo** → redirigir a Google OAuth con `?username=xxx` en el callback URL → al volver, crear biolink → ir a dashboard
   - **Si está disponible y usuario está logueado** → crear biolink → ir a dashboard

3. **Usuario logueado con biolink existente** → redirigir automáticamente al dashboard desde la home

**Eliminaciones del plan original:**
- NO se crea `/dashboard/choose-username` (Task 1.3 eliminada)
- NO hay modal de username separado
- Task 1.4 se simplifica: el callback de OAuth lee `?username` y crea el biolink

---

## 2. Technical Description

### Approach

1. **Modificar `BioLinqHero`** para que el input sea funcional con validación Zod
2. **Crear hook `useUsernameClaim`** que orquesta:
   - Estado del input
   - Validación con Zod (formato)
   - Check de disponibilidad vía API (solo al submit, no real-time)
   - Lógica de submit según estado de auth
3. **Crear API route `/api/username/check`** para verificar disponibilidad
4. **Crear API route `/api/username/claim`** para registrar username (usuarios logueados)
5. **Modificar callback de Google OAuth** para leer `?username` y crear biolink automáticamente
6. **Modificar loader de home** para redirigir a dashboard si usuario ya tiene biolink

### Dependencies

- `app/services/username.server.ts` (ya existe)
- `app/lib/auth.server.ts` (getCurrentUser)
- `app/lib/auth.client.ts` (useSession, signIn)
- Zod para validación

### Data Flow

```
[Home Page]
    |
    v
[User types username] --> [Zod validation (format only)]
    |
    v
[Click "Claim" button]
    |
    +--> [Invalid format?] --> Show error, stop
    |
    +--> [Call /api/username/check]
         |
         +--> [Not available?] --> Show error (taken/reserved)
         |
         +--> [Available + Anonymous?] --> signIn.social('google', { callbackURL: '/api/auth/callback/google?username=xxx' })
         |
         +--> [Available + Logged in?] --> POST /api/username/claim --> Redirect to /dashboard
```

---

## 2.1. Architecture Gate

- **Pages are puzzles:** `home.tsx` solo compone `BioLinqHero` y maneja redirect en loader.
- **Loaders/actions are thin:** 
  - Loader de home: llama a `getCurrentUser` + `getUserBiolink`, decide redirect.
  - API routes: parsean request, llaman a servicios, retornan JSON.
- **Business logic is not in components:**
  - Validación de formato: Zod schema en `app/lib/username-validation.ts`
  - Check/claim: servicios en `app/services/username.server.ts`
  - Orquestación UI: hook `useUsernameClaim` en `app/hooks/`

### Route Module → Service Mapping

| Route | Loader/Action | Service Calls |
|-------|---------------|---------------|
| `home.tsx` | loader | `getCurrentUser()`, `getUserBiolink()` |
| `api.username.check.tsx` | loader | `checkUsernameAvailability()` |
| `api.username.claim.tsx` | action | `registerUsername()` |
| `api.auth.$.tsx` | (existing) | Modificar para leer `?username` en callback |

### Component → Hook Mapping

| Component | Hooks Used | Business Logic NOT Inside |
|-----------|------------|---------------------------|
| `BioLinqHero` | `useUsernameClaim`, `useSession` | Validación, API calls, redirect logic |

---

## 3. Files to Change/Create

### `app/lib/username-validation.ts` (NEW)
**Objective:** Schema Zod para validación de formato de username.

**Pseudocode:**
```pseudocode
IMPORT z from 'zod'

CONST USERNAME_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/

EXPORT FUNCTION createUsernameSchema(t: TranslationFn)
  RETURN z.string()
    .min(3, t('username_too_short'))
    .max(20, t('username_too_long'))
    .regex(USERNAME_REGEX, t('username_invalid_chars'))
    .transform(val => val.toLowerCase())
END
```

---

### `app/hooks/useUsernameClaim.ts` (NEW)
**Objective:** Hook que orquesta el flujo de claim de username desde el Hero.

**Pseudocode:**
```pseudocode
IMPORT useState, useCallback from 'react'
IMPORT useSession from auth.client
IMPORT signIn from auth.client
IMPORT createUsernameSchema from username-validation
IMPORT useTranslation from react-i18next
IMPORT useNavigate from react-router

TYPE ClaimState = 'idle' | 'checking' | 'claiming' | 'redirecting'
TYPE ClaimError = { type: 'validation' | 'availability' | 'server', message: string }

EXPORT FUNCTION useUsernameClaim()
  STATE username: string = ''
  STATE state: ClaimState = 'idle'
  STATE error: ClaimError | null = null
  
  CONST { data: session } = useSession()
  CONST { t } = useTranslation()
  CONST navigate = useNavigate()
  CONST schema = createUsernameSchema(t)
  
  FUNCTION setUsername(value: string)
    SET username = value.toLowerCase()
    SET error = null  // Clear error on change
  END
  
  ASYNC FUNCTION handleClaim()
    // 1. Validate format with Zod
    CONST parseResult = schema.safeParse(username)
    IF NOT parseResult.success
      SET error = { type: 'validation', message: parseResult.error.errors[0].message }
      RETURN
    END
    
    CONST validUsername = parseResult.data
    SET state = 'checking'
    
    // 2. Check availability via API
    TRY
      CONST response = await fetch(`/api/username/check?username=${validUsername}`)
      CONST result = await response.json()
      
      IF NOT result.available
        SET error = { type: 'availability', message: t(`username_error_${result.reason.toLowerCase()}`) }
        SET state = 'idle'
        RETURN
      END
      
      // 3. Username is available - proceed based on auth state
      IF session?.user
        // User is logged in - claim directly
        SET state = 'claiming'
        CONST claimResponse = await fetch('/api/username/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: validUsername })
        })
        CONST claimResult = await claimResponse.json()
        
        IF claimResult.success
          SET state = 'redirecting'
          navigate('/dashboard')
        ELSE
          SET error = { type: 'server', message: t(`username_error_${claimResult.error.toLowerCase()}`) }
          SET state = 'idle'
        END
      ELSE
        // User is anonymous - redirect to Google OAuth with username in callback
        SET state = 'redirecting'
        signIn.social({
          provider: 'google',
          callbackURL: `/?username=${validUsername}&claim=true`
        })
      END
    CATCH
      SET error = { type: 'server', message: t('username_error_server') }
      SET state = 'idle'
    END
  END
  
  RETURN { username, setUsername, handleClaim, state, error, isLoggedIn: !!session?.user }
END
```

---

### `app/routes/api.username.check.tsx` (NEW)
**Objective:** API endpoint para verificar disponibilidad de username.

**Pseudocode:**
```pseudocode
IMPORT checkUsernameAvailability from username.server
IMPORT json from react-router

LOADER (request):
  CONST url = new URL(request.url)
  CONST username = url.searchParams.get('username')
  
  IF NOT username
    RETURN json({ error: 'username required' }, { status: 400 })
  END
  
  CONST result = await checkUsernameAvailability(username.toLowerCase())
  
  RETURN json(result)
END
```

---

### `app/routes/api.username.claim.tsx` (NEW)
**Objective:** API endpoint para registrar username (solo usuarios autenticados).

**Pseudocode:**
```pseudocode
IMPORT registerUsername from username.server
IMPORT requireAuth from auth.server
IMPORT json from react-router

ACTION (request):
  // Require authentication
  CONST { user } = await requireAuth(request)
  
  CONST body = await request.json()
  CONST username = body.username
  
  IF NOT username OR typeof username !== 'string'
    RETURN json({ success: false, error: 'USERNAME_REQUIRED' }, { status: 400 })
  END
  
  CONST result = await registerUsername(user.id, username.toLowerCase())
  
  RETURN json(result)
END
```

---

### `app/routes/home.tsx` (MODIFY)
**Objective:** Añadir lógica en loader para redirect si usuario tiene biolink, y manejar callback de OAuth con username.

**Pseudocode:**
```pseudocode
LOADER (request):
  CONST authSession = await getCurrentUser(request)
  
  IF authSession?.user
    // Check if user already has biolink
    CONST biolink = await getUserBiolink(authSession.user.id)
    IF biolink
      RETURN redirect('/dashboard')
    END
    
    // Check if coming back from OAuth with username to claim
    CONST url = new URL(request.url)
    CONST usernameToCliam = url.searchParams.get('username')
    CONST shouldClaim = url.searchParams.get('claim') === 'true'
    
    IF usernameToCliam AND shouldClaim
      // Try to register the username
      CONST result = await registerUsername(authSession.user.id, usernameToCliam.toLowerCase())
      IF result.success
        RETURN redirect('/dashboard')
      END
      // If failed, continue to render home with error (user can try again)
      RETURN { user: authSession.user, claimError: result.error }
    END
  END
  
  RETURN { user: authSession?.user ?? null, claimError: null }
END

COMPONENT Home:
  CONST { claimError } = useLoaderData()
  
  RETURN (
    <div className="min-h-screen bg-neo-canvas flex flex-col">
      <BioLinqHero initialError={claimError} />
    </div>
  )
END
```

---

### `app/services/username.server.ts` (MODIFY)
**Objective:** Añadir función `getUserBiolink` para verificar si usuario ya tiene biolink.

**Pseudocode:**
```pseudocode
// ADD new function

EXPORT ASYNC FUNCTION getUserBiolink(userId: string): Promise<Biolink | null>
  CONST result = await db
    .select()
    .from(biolinks)
    .where(eq(biolinks.userId, userId))
    .limit(1)
  
  RETURN result[0] ?? null
END
```

---

### `app/components/landing/BioLinqHero.tsx` (MODIFY)
**Objective:** Hacer el input funcional usando el hook `useUsernameClaim`.

**Pseudocode:**
```pseudocode
IMPORT useUsernameClaim from hooks/useUsernameClaim
IMPORT useTranslation from react-i18next

PROPS:
  initialError?: string  // Error from OAuth callback claim attempt

COMPONENT BioLinqHero:
  CONST { t } = useTranslation()
  CONST { 
    username, 
    setUsername, 
    handleClaim, 
    state, 
    error 
  } = useUsernameClaim()
  
  // Show initialError if present (from failed OAuth callback claim)
  CONST displayError = error?.message ?? (initialError ? t(`username_error_${initialError.toLowerCase()}`) : null)
  
  CONST isLoading = state === 'checking' || state === 'claiming' || state === 'redirecting'
  
  CONST buttonText = SWITCH state:
    'checking' -> t('username_checking')
    'claiming' -> t('username_claiming')
    'redirecting' -> t('username_redirecting')
    default -> t('hero_cta')
  END
  
  RETURN (
    <main>
      {/* ... existing hero content ... */}
      
      {/* Action Box */}
      <NeoBrutalCard>
        <div className="flex flex-col gap-4">
          {/* Username Input with prefix */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">
              biolinq.page/
            </span>
            <NeoBrutalInput 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="pl-28 text-left font-mono"
              disabled={isLoading}
            />
          </div>
          
          {/* Error message */}
          IF displayError
            <p className="text-accent text-sm font-medium">{displayError}</p>
          END
          
          {/* Claim Button */}
          <NeoBrutalButton 
            variant="accent" 
            className="w-full gap-3"
            onClick={handleClaim}
            disabled={isLoading || !username}
          >
            {/* Google icon */}
            <svg>...</svg>
            {buttonText}
          </NeoBrutalButton>
          
          <p className="text-xs text-gray-700 font-mono">{t('hero_pricing_note')}</p>
        </div>
      </NeoBrutalCard>
      
      {/* ... rest of hero ... */}
    </main>
  )
END
```

---

### `app/routes.ts` (MODIFY)
**Objective:** Registrar las nuevas rutas de API.

**Pseudocode:**
```pseudocode
// ADD new routes
route('api/username/check', 'routes/api.username.check.tsx'),
route('api/username/claim', 'routes/api.username.claim.tsx'),
```

---

## 4. I18N

### Existing keys to reuse
- `hero_cta` - "Create my BioLink" (button text when idle)
- `hero_pricing_note` - Pricing note below button

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `username_too_short` | Username must be at least 3 characters | El username debe tener al menos 3 caracteres |
| `username_too_long` | Username must be at most 20 characters | El username debe tener máximo 20 caracteres |
| `username_invalid_chars` | Only lowercase letters, numbers, and hyphens (not at start/end) | Solo letras minúsculas, números y guiones (no al inicio/final) |
| `username_error_username_taken` | This username is already taken | Este username ya está ocupado |
| `username_error_username_reserved` | This username is reserved | Este username está reservado |
| `username_error_user_already_has_biolink` | You already have a BioLink | Ya tienes un BioLink |
| `username_error_server` | Something went wrong. Please try again. | Algo salió mal. Inténtalo de nuevo. |
| `username_checking` | Checking... | Verificando... |
| `username_claiming` | Creating... | Creando... |
| `username_redirecting` | Redirecting... | Redirigiendo... |

---

## 5. E2E Test Plan

### Test: Anonymous user can check username availability
- **Preconditions:** User is not logged in, username "testuser123" is available
- **Steps:**
  1. Navigate to `/`
  2. Type "testuser123" in the username input
  3. Click "Create my BioLink" button
- **Expected:** User is redirected to Google OAuth (cannot test full OAuth flow, but verify redirect happens)

### Test: Validation error shown for invalid username format
- **Preconditions:** User is on home page
- **Steps:**
  1. Type "ab" (too short) in username input
  2. Click "Create my BioLink"
- **Expected:** Error message "Username must be at least 3 characters" is shown, no redirect

### Test: Error shown for reserved username
- **Preconditions:** User is on home page
- **Steps:**
  1. Type "admin" in username input
  2. Click "Create my BioLink"
- **Expected:** Error message "This username is reserved" is shown

### Test: Error shown for taken username
- **Preconditions:** Username "existinguser" is already registered
- **Steps:**
  1. Navigate to `/`
  2. Type "existinguser" in username input
  3. Click "Create my BioLink"
- **Expected:** Error message "This username is already taken" is shown

### Test: Logged-in user without biolink can claim username
- **Preconditions:** User is logged in, does not have a biolink
- **Steps:**
  1. Navigate to `/`
  2. Type "mynewusername" in username input
  3. Click "Create my BioLink"
- **Expected:** Biolink is created, user is redirected to `/dashboard`

### Test: Logged-in user with biolink is redirected to dashboard
- **Preconditions:** User is logged in and already has a biolink
- **Steps:**
  1. Navigate to `/`
- **Expected:** User is automatically redirected to `/dashboard`

### Test: Username input only accepts valid characters
- **Preconditions:** User is on home page
- **Steps:**
  1. Type "My_User@Name" in username input
  2. Click "Create my BioLink"
- **Expected:** Error about invalid characters is shown

---

## 6. PLANNING.md Updates Required

After implementation, update `PLANNING.md`:

### Task 1.1 - Change description to:
```markdown
#### Task 1.1: Username Claim from Home

- [ ] Create `app/lib/username-validation.ts` with Zod schema
- [ ] Create `app/hooks/useUsernameClaim.ts` hook
- [ ] Create `/api/username/check` route
- [ ] Create `/api/username/claim` route
- [ ] Modify `home.tsx` loader to redirect users with biolink + handle OAuth callback
- [ ] Modify `BioLinqHero.tsx` to use functional username input
- [ ] Add `getUserBiolink()` to username service
- [ ] Add i18n keys for username validation/errors
- [ ] E2E test: Validation errors shown for invalid username
- [ ] E2E test: Reserved/taken username shows error
- [ ] E2E test: Logged-in user can claim username and go to dashboard
- [ ] E2E test: User with biolink is redirected to dashboard from home
```

### Task 1.3 - Mark as REMOVED:
```markdown
#### Task 1.3: ~~Create Username Registration Route~~ (REMOVED)

> **Note:** This task was removed. Username registration now happens directly from the home page. See Task 1.1.
```

### Task 1.4 - Simplify to:
```markdown
#### Task 1.4: Update Auth Flow Redirect

- [ ] OAuth callback reads `?username` param and creates biolink automatically (handled in Task 1.1)
- [ ] E2E test: New user coming from OAuth with username gets biolink created
```

---

## 7. Notes

- La validación de formato (Zod) se hace client-side al hacer submit, no en tiempo real mientras escribe
- El check de disponibilidad se hace vía API solo después de pasar validación de formato
- El username se persiste en el callback URL de OAuth (`?username=xxx&claim=true`)
- Si el claim falla después del OAuth (race condition), el usuario ve el error y puede intentar otro username
- El loader de home maneja tanto el redirect de usuarios con biolink como el claim post-OAuth
