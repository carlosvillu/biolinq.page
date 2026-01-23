import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router'
import { z } from 'zod'
import { grantPremium, getPremiumStatus } from '~/services/premium.server'

const grantSchema = z.object({
  userId: z.string().uuid(),
  stripeCustomerId: z.string()
})

export async function loader({ request }: LoaderFunctionArgs) {
  if (!process.env.DB_TEST_URL) {
    throw new Response('Not Found', { status: 404 })
  }

  const url = new URL(request.url)
  const userId = url.searchParams.get('userId')

  if (!userId) {
    throw new Response('userId is required', { status: 400 })
  }

  const status = await getPremiumStatus(userId)
  return new Response(JSON.stringify(status), {
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    throw new Response('Method Not Allowed', { status: 405 })
  }

  if (!process.env.DB_TEST_URL) {
    throw new Response('Not Found', { status: 404 })
  }

  const body = await request.json()
  const result = grantSchema.safeParse(body)

  if (!result.success) {
    throw new Response('Invalid request body', { status: 400 })
  }

  await grantPremium(result.data.userId, result.data.stripeCustomerId)
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
