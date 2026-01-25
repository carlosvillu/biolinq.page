# FEATURE_6.1_StripeConfiguration.md

## ✅ IMPLEMENTATION STATUS: 100% COMPLETE

**Verificado en producción: Sin fallos ✅**

---

## 1. Natural Language Description

**Estado actual:** El proyecto no tiene integración con Stripe. Las variables de entorno para Stripe ya están definidas en `.env.example` (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`) y el usuario confirma que están configuradas en su entorno local. El `package.json` no incluye la dependencia `stripe`. Los campos `is_premium` y `stripe_customer_id` ya existen en la tabla `users`.

**Estado esperado:** El SDK de Stripe está instalado, existe un módulo server-side (`app/lib/stripe.server.ts`) que inicializa el cliente Stripe y exporta tanto el cliente como la configuración necesaria (price ID). El módulo valida en runtime que las variables de entorno requeridas estén presentes, lanzando un error claro si faltan.

## 2. Technical Description

- Instalar `stripe` como dependencia de producción.
- Crear `app/lib/stripe.server.ts` siguiendo el patrón `.server.ts` del proyecto para que solo se ejecute en el servidor (tree-shaking de React Router/Vite elimina `.server.ts` del bundle del cliente).
- El módulo exporta:
  - `stripe`: instancia del cliente `Stripe` inicializada con `STRIPE_SECRET_KEY`.
  - `STRIPE_PRICE_ID`: el ID del precio del producto premium.
  - `STRIPE_WEBHOOK_SECRET`: el secreto para verificar webhooks.
- Validación en runtime: si `STRIPE_SECRET_KEY` o `STRIPE_PRICE_ID` no están definidos, el módulo lanza un error descriptivo al importarse.
- No se crean rutas, componentes ni servicios en esta task. Solo la configuración base.

## 2.1. Architecture Gate

- **Pages are puzzles:** No aplica, no se crean rutas.
- **Loaders/actions are thin:** No aplica, no se crean loaders/actions.
- **Business logic is not in components:** No aplica, no se crean componentes.

Este archivo vive en `app/lib/` porque es infraestructura framework-agnostic (inicialización de un SDK externo), al igual que `app/lib/auth.ts`.

## 3. Files to Change/Create

### `app/lib/stripe.server.ts` (CREAR)

**Objective:** Inicializar el cliente Stripe server-side con validación de variables de entorno. Exportar el cliente y constantes de configuración para uso en servicios posteriores.

**Pseudocode:**

```pseudocode
IMPORT Stripe from 'stripe'

// Validación runtime
CONST stripeSecretKey = process.env.STRIPE_SECRET_KEY
IF NOT stripeSecretKey
  THROW Error("Missing STRIPE_SECRET_KEY environment variable")
END

CONST stripePriceId = process.env.STRIPE_PRICE_ID
IF NOT stripePriceId
  THROW Error("Missing STRIPE_PRICE_ID environment variable")
END

CONST stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
IF NOT stripeWebhookSecret
  THROW Error("Missing STRIPE_WEBHOOK_SECRET environment variable")
END

// Inicialización del cliente Stripe
EXPORT const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-04-30.basil',  // usar la última versión estable del API
  typescript: true,
})

EXPORT const STRIPE_PRICE_ID = stripePriceId
EXPORT const STRIPE_WEBHOOK_SECRET = stripeWebhookSecret
```

**Notas:**
- La `apiVersion` debe ser la última versión estable disponible del API de Stripe al momento de implementar. Verificar en la documentación de Stripe.
- El sufijo `.server.ts` asegura que este módulo nunca se incluya en el bundle del cliente.

## 4. E2E Test Plan

Esta task no requiere tests E2E porque:
- No hay UI ni rutas nuevas.
- La validación de la configuración se verifica implícitamente cuando las tasks 6.2 y 6.3 usen este módulo.
- Los tests de las tasks 6.2-6.4 cubrirán que el cliente Stripe funciona correctamente.

**Verificación manual:** El servidor arranca sin errores cuando las variables están configuradas (ya confirmado por el usuario).

## 5. Comandos de instalación

```bash
npm install stripe
```
