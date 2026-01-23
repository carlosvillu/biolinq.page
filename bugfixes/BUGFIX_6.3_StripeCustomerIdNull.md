# BUGFIX_6.3_StripeCustomerIdNull.md

## 1. Bug Description

### Current Behavior (Bug)

Cuando un usuario completa el pago de premium a través de Stripe Checkout, el campo `is_premium` se actualiza correctamente a `true`, pero el campo `stripe_customer_id` queda como `null` en la base de datos.

**Logs de producción:**
```
[WEBHOOK] User ID from metadata: 90864f6a-97f4-41ff-b5ca-94aaabd188c3
[WEBHOOK] Stripe Customer ID: null
[WEBHOOK] ✅ Granted premium to user 90864f6a-97f4-41ff-b5ca-94aaabd188c3
```

**Steps to reproduce:**
1. Iniciar sesión como usuario no-premium
2. Ir al dashboard y hacer clic en "Upgrade to Premium"
3. Completar el pago en Stripe Checkout
4. Verificar en la base de datos: `is_premium = true` pero `stripe_customer_id = null`

### Expected Behavior (After Fix)

Después del pago, ambos campos se actualizan: `is_premium = true` y `stripe_customer_id = 'cus_xxxxx'` (el ID del Customer creado por Stripe).

## 2. Technical Analysis

### Conflicting Flow

1. `api.stripe.checkout.tsx` crea la sesión de Checkout con `customer_email` pero **sin** `customer` ni `customer_creation`.
2. En modo `payment` con solo `customer_email`, Stripe **no** crea un Customer object automáticamente.
3. El webhook recibe `checkout.session.completed` donde `session.customer` es `null`.
4. `grantPremium(userId, null)` se ejecuta correctamente, seteando `stripeCustomerId: null`.

### Root Cause

**OBVIO:** En `api.stripe.checkout.tsx:34-49`, la sesión de Stripe Checkout se crea con `customer_email` pero sin la opción `customer_creation: 'always'`. En modo `payment`, Stripe solo crea un Customer object si se le indica explícitamente. Sin esta opción, `session.customer` en el evento del webhook será `null`.

**Referencia Stripe docs:** En sesiones de checkout con `mode: 'payment'`, hay que usar `customer_creation: 'always'` para forzar la creación de un Customer. Sin esto, Stripe procesa el pago como "guest checkout" y no genera un `customer` ID.

## 3. Solution Plan

### `app/routes/api.stripe.checkout.tsx` (MODIFICAR)

**Objective:** Añadir `customer_creation: 'always'` a la creación de la sesión de Stripe Checkout para que Stripe cree un Customer object y el webhook reciba un `session.customer` con valor.

**Pseudocode:**

```pseudocode
// ANTES (línea 34-49):
stripe.checkout.sessions.create({
  mode: 'payment',
  payment_method_types: ['card'],
  allow_promotion_codes: true,
  line_items: [...],
  success_url: ...,
  cancel_url: ...,
  metadata: { userId: ... },
  customer_email: ...,
})

// DESPUÉS:
stripe.checkout.sessions.create({
  mode: 'payment',
  payment_method_types: ['card'],
  allow_promotion_codes: true,
  customer_creation: 'always',   // <-- AÑADIR ESTA LÍNEA
  line_items: [...],
  success_url: ...,
  cancel_url: ...,
  metadata: { userId: ... },
  customer_email: ...,
})
```

**Nota:** No se necesitan cambios en el webhook ni en el servicio `grantPremium`. El fix es exclusivamente en la creación de la sesión.

## 4. Regression Tests

### Test: Webhook endpoint with valid signature grants premium with customer ID

Este test ya existe en la suite E2E (FEATURE_6.3). El payload del test simula un `checkout.session.completed` con `customer: 'cus_test_xyz'`, por lo que el test de regresión ya cubre el escenario donde `customer` tiene valor. El bug solo ocurre en producción porque la sesión real no generaba un customer.

**Test manual de regresión:**
- **Preconditions:** Deploy con el fix aplicado, usuario no-premium en producción
- **Steps:**
  1. Iniciar sesión como usuario no-premium
  2. Completar el flujo de pago con Stripe Checkout
  3. Verificar en la base de datos
- **Expected:** `is_premium = true` y `stripe_customer_id = 'cus_xxxxx'` (no null)

## 5. Lessons Learned

Añadir a `docs/KNOWN_ISSUES.md`:

### Stripe Checkout `customer_creation` en modo `payment`

**Problem:** En modo `payment`, Stripe no crea un Customer object por defecto. El campo `session.customer` será `null` en el webhook.

**Root Cause:** `customer_email` solo pre-rellena el email en el formulario de Checkout, pero no implica creación de Customer en modo `payment`.

**Solution:** Usar `customer_creation: 'always'` en `stripe.checkout.sessions.create()`.

**Prevention:** Cuando se necesite un `customer` ID de Stripe (para futuras suscripciones, portal de cliente, o tracking), siempre usar `customer_creation: 'always'` o crear el customer manualmente antes del checkout.
