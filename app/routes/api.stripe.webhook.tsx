import type { ActionFunctionArgs } from 'react-router'
import { stripe, STRIPE_WEBHOOK_SECRET } from '~/lib/stripe.server'
import { grantPremium } from '~/services/premium.server'

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log('[WEBHOOK] Received request to /api/stripe/webhook')

  // Solo aceptar POST
  if (request.method !== 'POST') {
    console.log('[WEBHOOK] Rejected: Method not POST')
    return new Response('Method Not Allowed', { status: 405, headers: { 'Cache-Control': 'no-store' } })
  }

  // Obtener header de firma y raw body
  const signature = request.headers.get('stripe-signature')
  const payload = await request.text()

  console.log('[WEBHOOK] Signature present:', !!signature)
  console.log('[WEBHOOK] Payload length:', payload.length)

  if (!signature) {
    console.log('[WEBHOOK] Rejected: Missing signature')
    return new Response('Missing stripe-signature header', { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  // Verificar firma del webhook
  let event
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_WEBHOOK_SECRET
    )
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook signature verification failed: ${errorMessage}`)
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  // Manejar solo checkout.session.completed
  console.log('[WEBHOOK] Event type:', event.type)

  if (event.type === 'checkout.session.completed') {
    console.log('[WEBHOOK] Processing checkout.session.completed')
    const session = event.data.object
    const userId = session.metadata?.userId
    const stripeCustomerId = session.customer

    console.log('[WEBHOOK] User ID from metadata:', userId)
    console.log('[WEBHOOK] Stripe Customer ID:', stripeCustomerId)

    if (userId) {
      try {
        const customerId =
          typeof stripeCustomerId === 'string' ? stripeCustomerId : null
        await grantPremium(userId, customerId)
        console.log(`[WEBHOOK] ✅ Granted premium to user ${userId}`)
      } catch (error) {
        console.error('[WEBHOOK] ❌ Error granting premium:', error)
        // Retornar 200 igualmente para que Stripe no reintente.
        // El error queda logeado para investigación.
      }
    } else {
      console.error('[WEBHOOK] ❌ Missing userId in session metadata')
    }
  } else {
    console.log('[WEBHOOK] Event type not handled, returning 200')
  }

  // SIEMPRE responder 200 para confirmar recepción.
  // Si retornamos un error, Stripe reintentará el webhook indefinidamente.
  return new Response(null, { status: 200, headers: { 'Cache-Control': 'no-store' } })
}
