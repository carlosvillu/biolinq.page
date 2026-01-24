# FEATURE_9.3_EcommerceTracking.md

## 1. Natural Language Description

**Estado actual:** El sistema de analytics tiene ~15 eventos custom de GA4, incluyendo `premium_cta_clicked` que se dispara cuando el usuario hace clic en "Go Premium". Sin embargo, no hay tracking de ecommerce: no se registra `begin_checkout` ni `purchase`, y no hay datos de transacciones (revenue, currency, items) enviados a GA4. El redirect de Stripe tras un pago exitoso lleva a `/dashboard?upgrade=success` pero no se dispara ningún evento ni hay feedback visual.

**Estado esperado:** Tras esta tarea:
1. Cuando el usuario hace clic en "Go Premium", se dispara `begin_checkout` (junto con el ya existente `premium_cta_clicked`).
2. La URL de retorno de Stripe incluye el `session_id` real (`?upgrade=success&session_id={CHECKOUT_SESSION_ID}`).
3. Cuando el usuario aterriza en el dashboard con `?upgrade=success&session_id=...`, se dispara el evento `purchase` de GA4 con datos de ecommerce (transaction_id, value, currency, items).
4. El `user_id` hasheado se configura en GA4 para cross-device tracking.
5. Los eventos de ecommerce son verificables en los reportes de Monetización de GA4.

---

## 2. Technical Description

Se implementará tracking de ecommerce GA4 con dos eventos principales:

- **`begin_checkout`**: Se dispara client-side en el `onSubmit` del formulario de checkout, en el mismo punto donde ya se dispara `premium_cta_clicked`. Esto aplica tanto al `PremiumBanner` (dashboard) como al `PricingSection` (landing), aunque el de landing no tiene formulario de checkout directo (va a login), así que solo aplica al `PremiumBanner`.

- **`purchase`**: Se dispara client-side cuando el dashboard detecta `?upgrade=success&session_id=X` en la URL. Se usa un hook `useUpgradeTracking` que lee los search params, dispara el evento una vez, y limpia los params de la URL.

- **User ID**: Se configura el `user_id` hasheado en la inicialización de GA4 usando `gtag('config', GA_ID, { user_id: hashedUserId })`. El hash se calcula server-side y se pasa al cliente como parte de los datos del root loader.

Para el hash del user ID se usará SHA-256 truncado, calculado en el servidor y enviado al cliente a través del root loader.

---

## 2.1. Architecture Gate

- **Pages are puzzles:** La ruta `dashboard.tsx` no añade UI nueva; solo pasa el `session_id` de los search params al hook. La ruta `root.tsx` pasa el `hashedUserId` al componente `GoogleAnalytics`.
- **Loaders/actions are thin:** El checkout action solo modifica el `success_url` para incluir `{CHECKOUT_SESSION_ID}`. El root loader calcula el hash del userId y lo pasa al cliente.
- **Business logic is not in components:**
  - La lógica de hashing del userId vive en `app/lib/hash.server.ts`.
  - Los eventos de GA4 se definen en `app/lib/analytics-events.ts`.
  - La detección y gestión del redirect post-checkout vive en `app/hooks/useUpgradeTracking.ts`.
  - Los componentes solo consumen hooks y disparan eventos.

---

## 3. Files to Change/Create

### `app/lib/analytics-events.ts`
**Objective:** Añadir las funciones `trackBeginCheckout()` y `trackPurchase()` siguiendo los estándares GA4 ecommerce.

**Pseudocode:**
```pseudocode
// Ecommerce events (GA4 standard)

FUNCTION trackBeginCheckout()
  CALL gtagEvent('begin_checkout', {
    currency: 'EUR',
    value: 5.00,
    items: [{ item_name: 'BioLinq Premium', price: 5.00, quantity: 1 }]
  })
END

FUNCTION trackPurchase(transactionId: string)
  CALL gtagEvent('purchase', {
    transaction_id: transactionId,
    value: 5.00,
    currency: 'EUR',
    items: [{ item_name: 'BioLinq Premium', price: 5.00, quantity: 1 }]
  })
END
```

---

### `app/hooks/useAnalytics.ts`
**Objective:** Exportar las nuevas funciones `trackBeginCheckout` y `trackPurchase` desde el hook.

**Pseudocode:**
```pseudocode
// Add imports for trackBeginCheckout, trackPurchase

FUNCTION useAnalytics()
  RETURN {
    ...existing functions,
    trackBeginCheckout,
    trackPurchase,
  }
END
```

---

### `app/components/dashboard/PremiumBanner.tsx`
**Objective:** Disparar `trackBeginCheckout()` junto con `trackPremiumCTAClicked()` en el onSubmit del formulario.

**Pseudocode:**
```pseudocode
COMPONENT PremiumBanner
  HOOK { trackPremiumCTAClicked, trackBeginCheckout } = useAnalytics()

  ON form submit:
    CALL trackPremiumCTAClicked('dashboard_banner')
    CALL trackBeginCheckout()
  END

  // Rest of component unchanged
END
```

---

### `app/routes/api.stripe.checkout.tsx`
**Objective:** Modificar `success_url` para incluir el template `{CHECKOUT_SESSION_ID}` de Stripe.

**Pseudocode:**
```pseudocode
// In the stripe.checkout.sessions.create call:
BEFORE: success_url: `${origin}/dashboard?upgrade=success`
AFTER:  success_url: `${origin}/dashboard?upgrade=success&session_id={CHECKOUT_SESSION_ID}`

// cancel_url stays the same
```

---

### `app/lib/hash.server.ts`
**Objective:** Crear una función para generar un hash SHA-256 truncado del userId, para enviar a GA4 sin exponer el ID real.

**Pseudocode:**
```pseudocode
IMPORT crypto from 'node:crypto'

FUNCTION hashUserId(userId: string): string
  INPUT: userId (UUID string)
  PROCESS: SHA-256 hash, take first 16 characters
  OUTPUT: hex string (16 chars)

  hash = crypto.createHash('sha256').update(userId).digest('hex')
  RETURN hash.substring(0, 16)
END
```

---

### `app/hooks/useUpgradeTracking.ts`
**Objective:** Hook que detecta `?upgrade=success&session_id=X` en la URL, dispara el evento `purchase`, y limpia los search params para evitar disparos duplicados.

**Pseudocode:**
```pseudocode
IMPORT { useSearchParams } from 'react-router'
IMPORT { useEffect, useRef } from 'react'
IMPORT { trackPurchase } from '~/lib/analytics-events'

FUNCTION useUpgradeTracking()
  [searchParams, setSearchParams] = useSearchParams()
  hasFired = useRef(false)

  useEffect(() => {
    upgrade = searchParams.get('upgrade')
    sessionId = searchParams.get('session_id')

    IF upgrade === 'success' AND sessionId AND NOT hasFired.current THEN
      hasFired.current = true
      CALL trackPurchase(sessionId)

      // Clean URL params without navigation
      newParams = new URLSearchParams(searchParams)
      newParams.delete('upgrade')
      newParams.delete('session_id')
      setSearchParams(newParams, { replace: true })
    END
  }, [searchParams, setSearchParams])
END
```

---

### `app/routes/dashboard.tsx`
**Objective:** Invocar el hook `useUpgradeTracking()` en el componente del dashboard para que se dispare el tracking cuando el usuario vuelve de Stripe.

**Pseudocode:**
```pseudocode
// Add import
IMPORT { useUpgradeTracking } from '~/hooks/useUpgradeTracking'

COMPONENT DashboardPage
  // Existing hooks...
  CALL useUpgradeTracking()

  // Rest of component unchanged
END
```

---

### `app/lib/gtag.client.ts`
**Objective:** Añadir función `setUserId` que configura el `user_id` en GA4 para cross-device tracking.

**Pseudocode:**
```pseudocode
FUNCTION setUserId(measurementId: string, hashedUserId: string): void
  IF window is undefined OR gtag is not function THEN RETURN

  CALL window.gtag('config', measurementId, { user_id: hashedUserId })
END
```

---

### `app/root.tsx`
**Objective:** Pasar el `hashedUserId` al componente `GoogleAnalytics` y al hook de pageview para que se configure el user_id en GA4.

**Pseudocode:**
```pseudocode
// In loader:
IMPORT { hashUserId } from '~/lib/hash.server'

FUNCTION loader
  // ...existing auth check...
  hashedUserId = null
  IF authSession?.user THEN
    hashedUserId = hashUserId(authSession.user.id)
  END

  RETURN {
    ...existing data,
    hashedUserId,
  }
END

// In App component:
// Pass hashedUserId to GoogleAnalytics component
<GoogleAnalytics
  measurementId={gaMeasurementId}
  nodeEnv={nodeEnv}
  hashedUserId={hashedUserId}
/>
```

---

### `app/components/GoogleAnalytics.tsx`
**Objective:** Si se recibe `hashedUserId`, incluirlo en la configuración de gtag como `user_id`.

**Pseudocode:**
```pseudocode
INTERFACE GoogleAnalyticsProps
  measurementId: string | undefined
  nodeEnv: string
  hashedUserId: string | null

COMPONENT GoogleAnalytics({ measurementId, nodeEnv, hashedUserId })
  IF NOT measurementId THEN RETURN null

  // Build config object
  configObject = { send_page_view: false }
  IF hashedUserId THEN
    configObject.user_id = hashedUserId
  END

  RENDER:
    <script async src="gtag URL" />
    <script dangerouslySetInnerHTML>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', measurementId, configObject);
      gtag('set', 'user_properties', { environment: nodeEnv });
    </script>
END
```

---

## 4. I18N Section

No se requieren nuevas keys de i18n para esta tarea. Los eventos de analytics son invisibles al usuario y no afectan la UI.

---

## 5. E2E Test Plan

### Test: begin_checkout event fires when clicking Go Premium

- **Preconditions:** Usuario autenticado con biolink, no premium, en el dashboard
- **Steps:**
  1. Navegar a `/dashboard`
  2. Interceptar las requests de red al dominio de GA (`google-analytics.com` o la URL de gtag)
  3. Hacer clic en el botón "Go Premium"
  4. Verificar que antes del redirect se disparan los eventos
- **Expected:** Se intercepta una llamada a gtag con event_name `begin_checkout` con `currency: EUR`, `value: 5.00`

**Nota:** Este test tiene limitaciones porque el submit del formulario causa un redirect inmediato a Stripe. El enfoque recomendado es:
- Interceptar la request POST a `/api/stripe/checkout` para evitar el redirect real
- Verificar via `page.evaluate` que `window.dataLayer` contiene el evento `begin_checkout`

### Test: purchase event fires on successful upgrade redirect

- **Preconditions:** Usuario autenticado con biolink
- **Steps:**
  1. Navegar directamente a `/dashboard?upgrade=success&session_id=cs_test_abc123`
  2. Esperar a que la página cargue completamente
  3. Verificar el evento en `window.dataLayer`
- **Expected:** `window.dataLayer` contiene un evento `purchase` con `transaction_id: 'cs_test_abc123'`, `value: 5.00`, `currency: 'EUR'`

### Test: purchase event does NOT fire without session_id

- **Preconditions:** Usuario autenticado con biolink
- **Steps:**
  1. Navegar a `/dashboard?upgrade=success` (sin session_id)
  2. Esperar a que la página cargue
  3. Verificar `window.dataLayer`
- **Expected:** NO hay evento `purchase` en `window.dataLayer`

### Test: URL params are cleaned after purchase event fires

- **Preconditions:** Usuario autenticado con biolink
- **Steps:**
  1. Navegar a `/dashboard?upgrade=success&session_id=cs_test_xyz`
  2. Esperar a que el hook limpie los params
  3. Verificar la URL actual
- **Expected:** La URL final es `/dashboard` (sin query params)

### Test: Stripe checkout success_url includes session_id template

- **Preconditions:** Usuario autenticado con biolink, no premium
- **Steps:**
  1. Interceptar la request POST a `/api/stripe/checkout`
  2. Verificar la response de redirect
- **Expected:** La response redirect URL contiene el patrón `session_id=` (es un redirect a Stripe, no podemos verificar el template literal pero sí que la config está correcta - este test se valida indirectamente por el test de purchase event)

**Nota alternativa:** Este test puede no ser viable en E2E ya que el redirect va a Stripe. Se recomienda validar via el test de purchase (si el session_id llega al redirect, significa que el template funciona).

### Test: user_id is set in gtag config for authenticated users

- **Preconditions:** Usuario autenticado con biolink
- **Steps:**
  1. Navegar al dashboard
  2. Verificar la inicialización de gtag en `window.dataLayer`
- **Expected:** La configuración de gtag incluye un `user_id` (string de 16 caracteres hex)

### Test: user_id is NOT set for unauthenticated users

- **Preconditions:** No autenticado
- **Steps:**
  1. Navegar a la landing page `/`
  2. Verificar la inicialización de gtag
- **Expected:** La configuración de gtag NO incluye `user_id`
