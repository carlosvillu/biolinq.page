# FEATURE_6.3_StripeWebhookHandler.md

## 1. Natural Language Description

**Estado actual:** El SDK de Stripe ya está configurado en `app/lib/stripe.server.ts`, incluyendo la constante `STRIPE_WEBHOOK_SECRET`. La ruta `/api/stripe/checkout` (Task 6.2) crea sesiones de Stripe Checkout con `metadata.userId` incluido. Los campos `is_premium` y `stripe_customer_id` ya existen en la tabla `users`. Sin embargo, no hay ningún endpoint que reciba las notificaciones (webhooks) de Stripe para confirmar el pago.

**Estado esperado:** Existe un endpoint POST `/api/stripe/webhook` que:
- Recibe los eventos de Stripe (webhooks)
- Verifica la firma del webhook usando `STRIPE_WEBHOOK_SECRET`
- Cuando recibe un evento `checkout.session.completed`, extrae el `userId` del metadata y el `customer` del session
- Actualiza el usuario en la base de datos: `is_premium = true` y `stripe_customer_id = session.customer`
- Si el usuario ya es premium (idempotencia), simplemente retorna 200 sin hacer cambios
- Retorna 200 para confirmar la recepción del evento a Stripe

## 2. Technical Description

- Crear un API route POST `/api/stripe/webhook` que no use autenticación (Stripe no envía cookies de sesión)
- Usar `request.text()` para obtener el raw body (la Web Fetch API de React Router/Netlify no parsea el body automáticamente)
- Verificar la firma del webhook con `stripe.webhooks.constructEvent(rawBody, sig, secret)`
- Manejar solo el evento `checkout.session.completed`; ignorar otros eventos con 200
- Crear un servicio `app/services/premium.server.ts` con la función `grantPremium(userId, stripeCustomerId)` que actualiza la DB
- Idempotencia simple: si el usuario ya tiene `is_premium = true`, el servicio no hace nada
- Crear una ruta de test `api.__test__.premium.tsx` para poder testear el servicio en E2E sin depender del webhook real de Stripe

### Decisiones:
- **Raw body:** `request.text()` devuelve el body como string sin parsear, compatible con `constructEvent()`
- **Sin auth:** Los webhooks de Stripe no llevan sesión de usuario, la autenticación es via firma criptográfica
- **Idempotencia:** Verificar `is_premium` antes de actualizar (sin tabla de event IDs)
- **Servicio separado:** La lógica de negocio de "grant premium" va en un servicio para reutilizarla en tests y futuras operaciones

## 2.1. Architecture Gate

- **Pages are puzzles:** La ruta `api.stripe.webhook.tsx` no tiene componente UI, solo un `action`.
- **Loaders/actions are thin:** El action parsea el raw body, verifica la firma, extrae datos del evento y llama al servicio `grantPremium`. No implementa lógica de negocio inline.
- **Business logic is not in components:**
  - La lógica de actualización de premium está en `app/services/premium.server.ts`.
  - El route solo orquesta: verificar firma → extraer datos → llamar servicio → responder.

**Para cada route module:**
- `api.stripe.webhook.tsx`: action verifica firma con `stripe.webhooks.constructEvent`, extrae `userId` y `customer` del evento, llama a `grantPremium(userId, stripeCustomerId)`. No tiene loader ni componente.
- `api.__test__.premium.tsx`: action llama a `grantPremium`; loader llama a `getPremiumStatus`. Solo disponible cuando `DB_TEST_URL` está definido.

## 3. Files to Change/Create

### `app/services/premium.server.ts` (CREAR)

**Objective:** Servicio con la lógica de negocio para conceder premium a un usuario. Actualiza `is_premium` y `stripe_customer_id` en la tabla `users`.

**Pseudocode:**

```pseudocode
IMPORT db from '~/db'
IMPORT users from '~/db/schema'
IMPORT eq from 'drizzle-orm'

EXPORT ASYNC FUNCTION grantPremium(userId: string, stripeCustomerId: string | null): Promise<void>
  // Verificar si ya es premium (idempotencia)
  CONST user = AWAIT db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, isPremium: true }
  })

  IF NOT user
    THROW new Error('User not found')
  END

  IF user.isPremium
    RETURN // Ya es premium, no hacer nada
  END

  // Actualizar usuario
  AWAIT db.update(users)
    .set({
      isPremium: true,
      stripeCustomerId: stripeCustomerId,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId))
END

EXPORT ASYNC FUNCTION getPremiumStatus(userId: string): Promise<{ isPremium: boolean; stripeCustomerId: string | null }>
  CONST user = AWAIT db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { isPremium: true, stripeCustomerId: true }
  })

  IF NOT user
    THROW new Error('User not found')
  END

  RETURN { isPremium: user.isPremium, stripeCustomerId: user.stripeCustomerId }
END
```

---

### `app/routes/api.stripe.webhook.tsx` (CREAR)

**Objective:** Endpoint que recibe webhooks de Stripe, verifica la firma y procesa el evento `checkout.session.completed` para conceder premium al usuario.

**Pseudocode:**

```pseudocode
IMPORT type ActionFunctionArgs from 'react-router'
IMPORT stripe, STRIPE_WEBHOOK_SECRET from '~/lib/stripe.server'
IMPORT grantPremium from '~/services/premium.server'

EXPORT CONST action = ASYNC ({ request }: ActionFunctionArgs) =>
  // Solo aceptar POST
  IF request.method !== 'POST'
    RETURN new Response('Method Not Allowed', { status: 405 })
  END

  // Obtener header de firma y raw body
  CONST signature = request.headers.get('stripe-signature')
  CONST payload = AWAIT request.text()

  IF NOT signature
    RETURN new Response('Missing stripe-signature header', { status: 400 })
  END

  // Verificar firma del webhook
  LET event
  TRY
    event = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET)
  CATCH (err: unknown)
    CONST errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook signature verification failed: ${errorMessage}`)
    RETURN new Response(`Webhook Error: ${errorMessage}`, { status: 400 })
  END

  // Manejar solo checkout.session.completed
  IF event.type === 'checkout.session.completed'
    CONST session = event.data.object
    CONST userId = session.metadata?.userId
    CONST stripeCustomerId = session.customer

    IF userId
      TRY
        CONST customerId = typeof stripeCustomerId === 'string' ? stripeCustomerId : null
        AWAIT grantPremium(userId, customerId)
        console.log(`Granted premium to user ${userId}`)
      CATCH (error)
        console.error('Error granting premium:', error)
        // Retornar 200 igualmente para que Stripe no reintente.
        // El error queda logeado para investigación.
      END
    ELSE
      console.error('Missing userId in session metadata')
    END
  END

  // SIEMPRE responder 200 para confirmar recepción.
  // Si retornamos un error, Stripe reintentará el webhook indefinidamente.
  RETURN new Response(null, { status: 200 })
END
```

**Notas (aprendidas del proyecto de referencia faviconforge):**
- **SIEMPRE retornar 200** al final, incluso si hay errores internos o datos faltantes. Si retornamos un error, Stripe reintentará el webhook, lo cual puede causar problemas.
- Logear errores para debugging, pero nunca bloquear la confirmación de recepción.
- `session.customer` puede ser un string (ID) o un objeto Customer expandido; extraer como `typeof === 'string' ? value : null`.
- NO usar `redirect()` ni `Response.json()` - usar `new Response()` directamente.
- NO requiere autenticación de usuario (no hay sesión). La autenticación es via firma criptográfica del webhook.

---

### `app/routes/api.__test__.premium.tsx` (CREAR)

**Objective:** Ruta de test para verificar el servicio de premium sin depender del webhook real de Stripe. Solo disponible cuando `DB_TEST_URL` está definido.

**Pseudocode:**

```pseudocode
IMPORT type LoaderFunctionArgs, ActionFunctionArgs from 'react-router'
IMPORT z from 'zod'
IMPORT grantPremium, getPremiumStatus from '~/services/premium.server'

CONST grantSchema = z.object({
  userId: z.string().uuid(),
  stripeCustomerId: z.string()
})

EXPORT ASYNC FUNCTION loader({ request }: LoaderFunctionArgs)
  IF NOT process.env.DB_TEST_URL
    THROW new Response('Not Found', { status: 404 })
  END

  CONST url = new URL(request.url)
  CONST userId = url.searchParams.get('userId')

  IF NOT userId
    THROW new Response('userId is required', { status: 400 })
  END

  CONST status = AWAIT getPremiumStatus(userId)
  RETURN new Response(JSON.stringify(status), {
    headers: { 'Content-Type': 'application/json' }
  })
END

EXPORT ASYNC FUNCTION action({ request }: ActionFunctionArgs)
  IF request.method !== 'POST'
    THROW new Response('Method Not Allowed', { status: 405 })
  END

  IF NOT process.env.DB_TEST_URL
    THROW new Response('Not Found', { status: 404 })
  END

  CONST body = AWAIT request.json()
  CONST result = grantSchema.safeParse(body)

  IF NOT result.success
    THROW new Response('Invalid request body', { status: 400 })
  END

  AWAIT grantPremium(result.data.userId, result.data.stripeCustomerId)
  RETURN new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
END
```

---

### `app/routes.ts` (MODIFICAR)

**Objective:** Registrar las nuevas rutas del webhook y del test de premium.

**Pseudocode:**

```pseudocode
// Añadir después de la ruta api/stripe/checkout:
route('api/stripe/webhook', 'routes/api.stripe.webhook.tsx')

// Añadir en la sección de __test__ routes:
route('api/__test__/premium', 'routes/api.__test__.premium.tsx')
```

---

### `tests/fixtures/app.fixture.ts` (MODIFICAR)

**Objective:** Pasar variables de entorno de Stripe al servidor de test para que `app/lib/stripe.server.ts` no lance errores al inicializarse. Usar valores dummy ya que los tests no hacen llamadas reales a la API de Stripe (solo verifican firmas de webhook con `generateTestHeaderString`).

**Pseudocode:**

```pseudocode
// En la línea donde se hace spawn del servidor, añadir las env vars de Stripe:
// ANTES:
env: { ...process.env, DB_TEST_URL: dbContext.connectionString }

// DESPUÉS:
env: {
  ...process.env,
  DB_TEST_URL: dbContext.connectionString,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_tests',
  STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID || 'price_test_dummy_for_tests',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret_for_e2e',
}
```

**Nota:** El valor de `STRIPE_WEBHOOK_SECRET` aquí (`whsec_test_secret_for_e2e`) es el mismo que los tests usarán con `stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_test_secret_for_e2e' })` para generar firmas válidas. Si el usuario ya tiene estas variables en su `.env`, se usarán esas en su lugar.

---

## 4. I18N

No se necesitan keys de i18n. Este task es backend-only (webhook + servicio). No hay UI nueva.

## 5. E2E Test Plan

### Test: Premium service grants premium status to user

- **Preconditions:** Usuario creado en la base de datos con `is_premium = false`
- **Steps:**
  1. Seed un usuario con `seedUser(dbContext, 'alice')`
  2. Hacer POST a `/api/__test__/premium` con `{ userId, stripeCustomerId: 'cus_test123' }`
  3. Hacer GET a `/api/__test__/premium?userId=<id>`
- **Expected:** Response contiene `{ isPremium: true, stripeCustomerId: 'cus_test123' }`

### Test: Premium service is idempotent (already premium user)

- **Preconditions:** Usuario creado con `is_premium = true`
- **Steps:**
  1. Seed un usuario con `seedUser(dbContext, 'alice', { isPremium: true })`
  2. Hacer POST a `/api/__test__/premium` con `{ userId, stripeCustomerId: 'cus_new456' }`
  3. Hacer GET a `/api/__test__/premium?userId=<id>`
- **Expected:** Response contiene `{ isPremium: true, stripeCustomerId: null }` (no se actualizó porque ya era premium)

### Test: Webhook endpoint rejects requests without stripe-signature header

- **Preconditions:** Ninguna
- **Steps:**
  1. Hacer POST a `/api/stripe/webhook` con body cualquiera, sin header `stripe-signature`
- **Expected:** Response status 400 con mensaje "Missing stripe-signature header"

### Test: Webhook endpoint rejects requests with invalid signature

- **Preconditions:** Ninguna
- **Steps:**
  1. Hacer POST a `/api/stripe/webhook` con body JSON y header `stripe-signature: invalid`
- **Expected:** Response status 400 con mensaje que incluye "Webhook Error"

### Test: Webhook endpoint with valid signature grants premium (using generateTestHeaderString)

- **Preconditions:** Usuario creado en DB, variable `STRIPE_WEBHOOK_SECRET` configurada en el entorno de test
- **Steps:**
  1. Seed un usuario con `seedUser(dbContext, 'alice')`
  2. Construir un payload JSON simulando un evento `checkout.session.completed` con `metadata.userId` y `customer: 'cus_test_xyz'`
  3. Generar el header de firma usando `stripe.webhooks.generateTestHeaderString({ payload, secret })` donde `secret` es el mismo `STRIPE_WEBHOOK_SECRET` del servidor
  4. Hacer POST a `/api/stripe/webhook` con el payload y el header generado
  5. Verificar premium status via `/api/__test__/premium?userId=<id>`
- **Expected:** Response status 200 y el usuario ahora tiene `isPremium: true` y `stripeCustomerId: 'cus_test_xyz'`

**Nota sobre el secret en tests:** El fixture `app.fixture.ts` pasa `STRIPE_WEBHOOK_SECRET=whsec_test_secret_for_e2e` al servidor de test. Los tests usan este mismo valor con `stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_test_secret_for_e2e' })`. Importar `Stripe` directamente en el test file (no el cliente inicializado del server) para acceder a `webhooks.generateTestHeaderString`.

### Test: Webhook endpoint returns 200 for unhandled event types

- **Preconditions:** Variable `STRIPE_WEBHOOK_SECRET` configurada en el entorno de test
- **Steps:**
  1. Construir un payload JSON simulando un evento `customer.created` (tipo no manejado)
  2. Generar header de firma válido con `generateTestHeaderString`
  3. Hacer POST a `/api/stripe/webhook`
- **Expected:** Response status 200
