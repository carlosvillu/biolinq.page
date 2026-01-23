# FEATURE_6.2_CheckoutFlow.md

## 1. Natural Language Description

**Estado actual:** El SDK de Stripe ya está instalado y configurado en `app/lib/stripe.server.ts`. El dashboard muestra un `PremiumBanner` con un botón "Go Premium" que está `disabled`. La landing page tiene un `PricingSection` con una `PricingCard` premium que tiene un botón CTA ("Get Premium") sin funcionalidad. Los campos `is_premium` y `stripe_customer_id` ya existen en la tabla `users`.

**Estado esperado:**
- El botón del `PremiumBanner` en el dashboard está habilitado y hace un POST a `/api/stripe/checkout`, que crea una sesión de Stripe Checkout y redirige al usuario a Stripe para pagar.
- El botón CTA de la `PricingCard` premium en la home se cambia a "Create my BioLink" y redirige al flujo de creación de cuenta (login), no al checkout.
- Al completar el pago, el usuario vuelve a `/dashboard?upgrade=success`.
- Al cancelar, el usuario vuelve a `/dashboard?upgrade=cancelled`.

## 2. Technical Description

- Crear un API route POST `/api/stripe/checkout` que:
  - Verifica autenticación (requiere sesión)
  - Verifica que el usuario tenga un biolink creado
  - Verifica que el usuario no sea ya premium
  - Crea una Stripe Checkout Session con el `STRIPE_PRICE_ID`, `success_url` y `cancel_url`
  - Incluye el `userId` en los metadata de la sesión (para el webhook en task 6.3)
  - Redirige (302) al `session.url` de Stripe
- Modificar `PremiumBanner` para que el botón sea un `<form>` con `method="POST"` y `action="/api/stripe/checkout"`, quitando el `disabled`.
- Modificar `PricingSection` para que el CTA del plan premium use la key i18n `hero_cta` ("Create my BioLink") y haga scroll al hero o navegue a login, en vez de iniciar un checkout.

### Decisiones:
- **Método:** POST via form submit (semántico y seguro para iniciar una acción de pago)
- **Redirect:** Misma ventana, el usuario vuelve al dashboard tras completar/cancelar
- **Requisitos:** El usuario debe tener un biolink creado (flujo natural del producto)
- **Home CTA:** Se reutiliza el flujo de creación de biolink existente, no se conecta a Stripe desde la home

## 2.1. Architecture Gate

- **Pages are puzzles:** La ruta `api.stripe.checkout.tsx` no tiene componente UI, solo un `action`.
- **Loaders/actions are thin:** El action parsea la request, verifica auth/biolink/premium status llamando a servicios existentes, crea la sesión de Stripe y redirige.
- **Business logic is not in components:**
  - La lógica de creación de checkout session se ejecuta en el action del route (usa `stripe` de `app/lib/stripe.server.ts` directamente, sin servicio intermedio, porque es una operación simple de SDK).
  - `PremiumBanner` solo renderiza un form sin lógica de negocio.
  - `PricingCard` solo renderiza UI.

**Para cada route module:**
- `api.stripe.checkout.tsx`: action llama a `getCurrentUser`, `getUserBiolink`, y `stripe.checkout.sessions.create`. No tiene loader ni componente.

**Para cada componente:**
- `PremiumBanner`: Renderiza un form POST. No tiene hooks de negocio.
- `PricingSection`/`PricingCard`: Solo cambia la prop `ctaText` y se quita `onCtaClick` (el CTA ahora es un link a la home/login).

## 3. Files to Change/Create

### `app/routes/api.stripe.checkout.tsx` (CREAR)

**Objective:** API route que crea una Stripe Checkout Session y redirige al usuario a la página de pago de Stripe.

**Pseudocode:**

```pseudocode
IMPORT redirect from 'react-router'
IMPORT type ActionFunctionArgs from 'react-router'
IMPORT getCurrentUser from '~/lib/auth.server'
IMPORT getUserBiolink from '~/services/username.server'
IMPORT stripe, STRIPE_PRICE_ID from '~/lib/stripe.server'

EXPORT ASYNC FUNCTION action({ request }: ActionFunctionArgs)
  // Solo aceptar POST
  IF request.method !== 'POST'
    THROW Response('Method Not Allowed', { status: 405 })
  END

  // Verificar autenticación
  CONST authSession = AWAIT getCurrentUser(request)
  IF NOT authSession?.user
    RETURN redirect('/auth/login')
  END

  // Verificar que tenga biolink
  CONST biolink = AWAIT getUserBiolink(authSession.user.id)
  IF NOT biolink
    RETURN redirect('/')
  END

  // Verificar que no sea ya premium
  IF authSession.user.isPremium
    RETURN redirect('/dashboard')
  END

  // Crear Stripe Checkout Session
  CONST session = AWAIT stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price: STRIPE_PRICE_ID,
      quantity: 1,
    }],
    success_url: `${origin}/dashboard?upgrade=success`,
    cancel_url: `${origin}/dashboard?upgrade=cancelled`,
    metadata: {
      userId: authSession.user.id,
    },
    customer_email: authSession.user.email,
  })

  // Redirigir a Stripe Checkout
  IF NOT session.url
    RETURN redirect('/dashboard?upgrade=error')
  END

  RETURN redirect(session.url)
END
```

**Notas:**
- `origin` se extrae de `new URL(request.url).origin`
- No necesita `loader` ni `component`, es un API-only route
- `customer_email` pre-rellena el email en el checkout de Stripe

---

### `app/routes.ts` (MODIFICAR)

**Objective:** Registrar la nueva ruta `/api/stripe/checkout`.

**Pseudocode:**

```pseudocode
// Añadir después de las rutas api existentes:
route('api/stripe/checkout', 'routes/api.stripe.checkout.tsx')
```

---

### `app/components/dashboard/PremiumBanner.tsx` (MODIFICAR)

**Objective:** Cambiar el botón disabled por un form POST que envía al usuario al checkout de Stripe.

**Pseudocode:**

```pseudocode
// ANTES:
<NeoBrutalButton variant="primary" size="sm" disabled className="whitespace-nowrap">
  {t('premium_banner_cta')}
</NeoBrutalButton>

// DESPUÉS:
<form method="POST" action="/api/stripe/checkout">
  <NeoBrutalButton type="submit" variant="primary" size="sm" className="whitespace-nowrap">
    {t('premium_banner_cta')}
  </NeoBrutalButton>
</form>
```

---

### `app/components/landing/PricingSection.tsx` (MODIFICAR)

**Objective:** Cambiar el CTA del plan premium de "Get Premium" a "Create my BioLink", reutilizando la key i18n existente `hero_cta`. Eliminar `onCtaClick` ya que no se necesita funcionalidad de checkout desde la home.

**Pseudocode:**

```pseudocode
// ANTES:
<PricingCard
  ...
  ctaText={t('pricing_premium_cta')}
/>

// DESPUÉS:
<PricingCard
  ...
  ctaText={t('hero_cta')}
  ctaHref="/auth/login"
/>
```

---

### `app/components/landing/PricingCard.tsx` (MODIFICAR)

**Objective:** Cambiar el botón CTA de `onClick` a un link (`<a>`) con `href`, ya que ahora el CTA de la PricingCard premium simplemente navega a otra página.

**Pseudocode:**

```pseudocode
// ANTES (interfaz):
onCtaClick?: () => void

// DESPUÉS (interfaz):
ctaHref?: string

// ANTES (render):
<button type="button" onClick={onCtaClick} ...>
  {ctaText}
</button>

// DESPUÉS (render):
<a href={ctaHref} ...>
  {ctaText}
</a>
```

**Nota:** Se mantiene el mismo styling del botón, solo cambia de `<button>` a `<a>`.

---

## 4. I18N

### Existing keys to reuse

- `premium_banner_cta` - "Go Premium — 5€" (para el botón del banner en dashboard)
- `hero_cta` - "Create my BioLink" (para el CTA del pricing card en home)

### New keys to create

No se necesitan nuevas keys i18n. Se reutilizan las existentes.

## 5. E2E Test Plan

### Test: Authenticated user with biolink can initiate Stripe checkout

- **Preconditions:** Usuario autenticado con biolink creado, no es premium
- **Steps:**
  1. Navegar a `/dashboard`
  2. Verificar que el PremiumBanner es visible
  3. Hacer click en el botón "Go Premium"
  4. Verificar que la página redirige (no se puede verificar la URL de Stripe en E2E, pero sí que sale del dashboard)
- **Expected:** El formulario se envía y el navegador sale del dashboard (redirect a Stripe o error por API keys de test)

**Nota sobre limitaciones:** No podemos hacer un test E2E completo del flujo de Stripe porque requiere interacción con la UI de Stripe (dominio externo). El test verificará que:
1. El botón del banner existe y es clickeable
2. El POST al endpoint responde con un redirect (no un error)

### Test: Unauthenticated request to /api/stripe/checkout redirects to login

- **Preconditions:** Usuario no autenticado
- **Steps:**
  1. Hacer POST a `/api/stripe/checkout` sin sesión
- **Expected:** Redirect a `/auth/login`

### Test: Premium user hitting checkout is redirected to dashboard

- **Preconditions:** Usuario autenticado y ya premium
- **Steps:**
  1. Hacer POST a `/api/stripe/checkout`
- **Expected:** Redirect a `/dashboard`

### Test: PricingCard CTA in home links to login

- **Preconditions:** Ninguna (usuario no logueado)
- **Steps:**
  1. Navegar a `/`
  2. Encontrar la sección de pricing
  3. Verificar que el CTA del plan premium tiene href="/auth/login" y texto "Create my BioLink"
- **Expected:** El link apunta a `/auth/login`
