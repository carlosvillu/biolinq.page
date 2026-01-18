# FEATURE_0.1_GoogleOAuthAutoSignUp

## 1. Natural Language Description

### Estado actual

El proyecto tiene un sistema de autenticación dual:
- **Email/Password**: Los usuarios pueden registrarse en `/auth/signup` y hacer login en `/auth/login` con email y password
- **Google OAuth**: Configurado con `disableImplicitSignUp: true`, lo que significa que los usuarios de Google solo pueden hacer login si ya tienen una cuenta creada previamente

La página de login (`/auth/login`) muestra:
1. Botón de Google OAuth
2. Formulario de email/password

La página de signup (`/auth/signup`) muestra:
1. Botón de Google OAuth
2. Formulario de registro con email/password

### Estado final esperado

El proyecto tendrá autenticación exclusivamente con Google OAuth:
- **Solo Google OAuth**: Los usuarios hacen login Y se registran automáticamente con Google en una única acción
- **Sin email/password en UI**: No hay formularios de email/password visibles para el usuario
- **Sin ruta de signup**: `/auth/signup` no existe (404)
- **Login simplificado**: `/auth/login` solo muestra el botón de Google OAuth

Nota importante: Email/password se mantiene habilitado en el backend para permitir la creación de usuarios en tests E2E via API.

---

## 2. Technical Description

### Cambios de configuración en Better Auth

1. Cambiar `disableImplicitSignUp: false` en la configuración de Google OAuth para permitir auto-registro
2. Mantener `emailAndPassword: { enabled: true }` para que los tests sigan funcionando via API

### Cambios de rutas

1. Eliminar la entrada de `/auth/signup` en `app/routes.ts`
2. Eliminar el archivo `app/routes/auth.signup.tsx`

### Cambios de UI

1. Simplificar `app/routes/auth.login.tsx` para mostrar solo el botón de Google OAuth
2. Eliminar referencias a signup en los links ("No tienes cuenta? Regístrate")
3. Actualizar el componente `GoogleAuthButton` para no necesitar el prop `mode` (ya no hay diferencia entre login y signup)

### Cambios de i18n

1. Eliminar keys relacionadas con email/password que ya no se usan en la UI
2. Mantener keys que puedan ser útiles para otros contextos

### Tests E2E

Según `docs/KNOWN_ISSUES.md`, no es práctico escribir tests E2E automatizados para flujos OAuth con proveedores externos. Por lo tanto:
- Verificar que la página de login solo muestra el botón de Google OAuth
- Verificar que `/auth/signup` devuelve 404
- Los tests existentes que usan `createAuthSession` seguirán funcionando porque email/password está habilitado en el backend

---

## 2.1. Architecture Gate

- **Pages are puzzles:** La ruta `/auth/login` es un módulo de ruta que compone componentes existentes (`Card`, `GoogleAuthButton`). No contiene lógica de negocio.
- **Loaders/actions are thin:** Esta tarea no requiere loaders ni actions ya que Google OAuth es manejado completamente por Better Auth via `/api/auth/*`.
- **Business logic is not in components:** La autenticación es manejada por Better Auth (servicio externo). Los componentes solo orquestan la UI.

**Componentes afectados:**
- `app/routes/auth.login.tsx` → Compone `Card`, `GoogleAuthButton`. No tiene lógica de negocio.
- `app/components/GoogleAuthButton.tsx` → Solo orquesta el llamado a `signIn.social()` de Better Auth.

---

## 3. Files to Change/Create

### `app/lib/auth.ts`

**Objetivo:** Habilitar auto-registro para Google OAuth

**Pseudocode:**
```pseudocode
// CAMBIAR en socialProviders.google:
BEFORE: disableImplicitSignUp: true
AFTER:  disableImplicitSignUp: false

// MANTENER sin cambios:
emailAndPassword: { enabled: true }  // Necesario para tests
```

---

### `app/routes.ts`

**Objetivo:** Eliminar la ruta de signup

**Pseudocode:**
```pseudocode
// ELIMINAR esta línea:
route('auth/signup', 'routes/auth.signup.tsx')

// MANTENER las demás rutas sin cambios
```

---

### `app/routes/auth.signup.tsx`

**Objetivo:** Eliminar este archivo completamente

**Pseudocode:**
```pseudocode
DELETE FILE
```

---

### `app/routes/auth.login.tsx`

**Objetivo:** Simplificar para mostrar solo Google OAuth

**Pseudocode:**
```pseudocode
COMPONENT LoginPage
  // ELIMINAR: useState para error, isLoading
  // ELIMINAR: useForm, form handling
  // ELIMINAR: onSubmit handler
  // ELIMINAR: loginSchema

  // MANTENER:
  useTranslation para t()
  useSearchParams para leer redirect

  RENDER:
    Container centrado (min-h-screen flex items-center justify-center)
      Card con border y bg-paper
        CardHeader
          CardTitle con t('login_title')
        CardContent
          GoogleAuthButton con callbackURL={redirect || '/'}
          // ELIMINAR: divider "or"
          // ELIMINAR: Form con email/password
          // ELIMINAR: error display
          // ELIMINAR: link a signup
END
```

---

### `app/components/GoogleAuthButton.tsx`

**Objetivo:** Simplificar eliminando el prop `mode` ya que siempre hace lo mismo

**Pseudocode:**
```pseudocode
INTERFACE GoogleAuthButtonProps
  callbackURL?: string  // ELIMINAR: mode prop

COMPONENT GoogleAuthButton
  PROPS: { callbackURL = '/' }

  STATE: isLoading

  HANDLER handleClick:
    setIsLoading(true)
    TRY:
      // Ya no hay distinción entre signup y login
      // Siempre permite creación de usuario (disableImplicitSignUp: false en servidor)
      signIn.social({ provider: 'google', callbackURL })
    CATCH:
      setIsLoading(false)

  RENDER:
    Button type="button" variant="secondary" className="w-full"
      Google SVG icon
      Text: isLoading ? t('google_connecting') : t('google_continue')
END
```

---

### `app/locales/en.json`

**Objetivo:** Limpiar keys no usadas en UI (mantener para posible uso futuro en otros contextos)

**Pseudocode:**
```pseudocode
// ELIMINAR las siguientes keys (ya no se usan en UI):
- "signup"
- "signup_title"
- "confirm_password_label"
- "password_placeholder_signup"
- "confirm_password_placeholder"
- "passwords_dont_match"
- "signup_error"
- "creating_account"
- "have_account_prompt"
- "signup_link"
- "no_account_prompt"
- "or_divider"

// MANTENER (pueden usarse internamente o en mensajes de error):
- "login", "login_title", "login_error", "logging_in", "login_link"
- "email_label", "email_placeholder", "invalid_email"
- "password_label", "password_placeholder", "password_min_length"
- "invalid_credentials"
- "google_continue"
- "loading"
- ... (resto de keys no relacionadas con auth forms)
```

---

### `app/locales/es.json`

**Objetivo:** Aplicar los mismos cambios que en en.json

**Pseudocode:**
```pseudocode
// ELIMINAR las mismas keys que en en.json:
- "signup", "signup_title", "confirm_password_label", etc.

// MANTENER las mismas keys que en en.json
```

---

### `tests/e2e/auth.spec.ts`

**Objetivo:** Actualizar tests para reflejar el nuevo comportamiento

**Pseudocode:**
```pseudocode
test.describe('Authentication')

  // ELIMINAR: test 'should allow user signup via email'
  // (Ya no hay UI de signup con email)

  // MODIFICAR: test 'should allow user login via email'
  // RENOMBRAR A: 'should allow user creation via API for testing'
  // Este test verifica que el backend aún permite crear usuarios via API
  test 'should allow user creation via API for testing':
    timestamp = Date.now()
    email = test-api-{timestamp}@example.com
    password = TestPassword123!

    // Crear usuario via API (esto sigue funcionando)
    createAuthSession(baseURL, { email, password })

    // Verificar que el usuario puede hacer login via API también
    // (No testeamos UI de email/password porque ya no existe)
    EXPECT: no error en createAuthSession

  // MANTENER: test 'should persist session across page refreshes'
  // (Este test usa la API, no la UI)

  // MODIFICAR: test 'should display Google OAuth button'
  // Cambiar a ir a /auth/login en vez de /auth/signup
  test 'should display Google OAuth button on login page':
    page.goto('/auth/login')
    googleButton = page.locator('button:has-text("Google")')
    EXPECT: googleButton.toBeVisible()

  // NUEVO: test 'signup page should not exist'
  test 'signup page returns 404':
    response = page.goto('/auth/signup')
    EXPECT: response.status() === 404

  // NUEVO: test 'login page shows only Google OAuth'
  test 'login page shows only Google OAuth option':
    page.goto('/auth/login')
    // Verificar que el formulario de email/password NO está presente
    emailInput = page.locator('input[name="email"]')
    EXPECT: emailInput.not.toBeVisible()

    // Verificar que el botón de Google SÍ está presente
    googleButton = page.locator('button:has-text("Google")')
    EXPECT: googleButton.toBeVisible()
END
```

---

## 4. I18N

### Existing keys to reuse

- `login_title` - Para el título de la página de login
- `google_continue` - Para el botón de Google OAuth
- `google_connecting` - Para el estado de carga del botón (nota: esta key no existe actualmente, hay que crearla o usar `loading`)

### Keys to delete

| Key | Reason |
|-----|--------|
| `signup` | No hay signup separado |
| `signup_title` | No hay página de signup |
| `confirm_password_label` | No hay formulario de password |
| `password_placeholder_signup` | No hay formulario de signup |
| `confirm_password_placeholder` | No hay confirmación de password |
| `passwords_dont_match` | No hay validación de passwords |
| `signup_error` | No hay signup con email |
| `creating_account` | No hay creación de cuenta con formulario |
| `have_account_prompt` | No hay link a login desde signup |
| `signup_link` | No hay link a signup |
| `no_account_prompt` | No hay prompt de signup en login |
| `or_divider` | No hay divisor entre OAuth y formulario |

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `google_connecting` | Connecting... | Conectando... |

**Nota:** Revisar si `google_connecting` ya existe o si se usa `loading` en su lugar.

---

## 5. E2E Test Plan

### Test: Signup page returns 404

- **Preconditions:** Ninguna
- **Steps:**
  1. Navegar a `/auth/signup`
- **Expected:** La página devuelve status 404

---

### Test: Login page shows only Google OAuth option

- **Preconditions:** Ninguna
- **Steps:**
  1. Navegar a `/auth/login`
  2. Buscar input con name="email"
  3. Buscar botón con texto "Google"
- **Expected:**
  - El input de email NO está visible
  - El botón de Google SÍ está visible
  - No hay formulario de login con email/password

---

### Test: API user creation still works for testing

- **Preconditions:** Servidor corriendo con TestContainers
- **Steps:**
  1. Llamar a `createAuthSession` con email y password
- **Expected:**
  - No hay error
  - Se retorna un token válido
  - El usuario se crea en la base de datos

---

### Test: Session persists across page refreshes (existente)

- **Preconditions:** Usuario creado via API
- **Steps:**
  1. Crear sesión via `createAuthSession`
  2. Setear cookie con `setAuthCookie`
  3. Navegar a `/`
  4. Refrescar página
- **Expected:** La sesión sigue activa

---

### Nota sobre tests de OAuth

Según `docs/KNOWN_ISSUES.md`, **no es práctico escribir tests E2E automatizados para flujos OAuth con proveedores externos** (Google, GitHub, etc.). Los tests verifican:
- Que la UI correcta se muestra (botón de Google visible)
- Que la configuración del backend permite crear usuarios via API

La verificación del flujo completo de Google OAuth debe hacerse **manualmente**.
