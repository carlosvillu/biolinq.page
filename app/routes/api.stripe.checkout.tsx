import { redirect } from 'react-router'
import type { ActionFunctionArgs } from 'react-router'
import { getCurrentUser } from '~/lib/auth.server'
import { getUserBiolink } from '~/services/username.server'
import { stripe, STRIPE_PRICE_ID } from '~/lib/stripe.server'

export async function action({ request }: ActionFunctionArgs) {
  // Only accept POST
  if (request.method !== 'POST') {
    throw new Response('Method Not Allowed', { status: 405 })
  }

  // Verify authentication
  const authSession = await getCurrentUser(request)
  if (!authSession?.user) {
    return redirect('/auth/login')
  }

  // Verify user has biolink
  const biolink = await getUserBiolink(authSession.user.id)
  if (!biolink) {
    return redirect('/')
  }

  // Verify user is not already premium
  if (authSession.user.isPremium) {
    return redirect('/dashboard')
  }

  // Extract origin from request
  const origin = new URL(request.url).origin

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    allow_promotion_codes: true,
    customer_creation: 'always',
    line_items: [
      {
        price: STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: `${origin}/dashboard?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard?upgrade=cancelled`,
    metadata: {
      userId: authSession.user.id,
    },
    customer_email: authSession.user.email,
  })

  // Redirect to Stripe Checkout
  if (!session.url) {
    return redirect('/dashboard?upgrade=error')
  }

  return redirect(session.url)
}
