import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { z } from 'zod'
import { checkUsernameAvailability, registerUsername } from '~/services/username.server'

const registerSchema = z.object({
  userId: z.string().uuid(),
  username: z.string(),
})

function assertTestDbEnabled() {
  if (!process.env.DB_TEST_URL) {
    throw new Response('Not Found', { status: 404 })
  }
}

function jsonResponse(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...init?.headers,
    },
  })
}

export async function loader({ request }: LoaderFunctionArgs) {
  assertTestDbEnabled()

  const url = new URL(request.url)
  const username = url.searchParams.get('username')
  if (!username) {
    return jsonResponse({ error: 'username query param is required' }, { status: 400 })
  }

  const result = await checkUsernameAvailability(username.toLowerCase().trim())
  return jsonResponse(result, { status: 200 })
}

export async function action({ request }: ActionFunctionArgs) {
  assertTestDbEnabled()

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, { status: 405 })
  }

  const body = await request.json().catch(() => null)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return jsonResponse({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const result = await registerUsername(
      parsed.data.userId,
      parsed.data.username.toLowerCase().trim()
    )
    return jsonResponse(result, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : ''
    return new Response(`Unexpected Server Error\n\nError: ${message}\n\nCause: ${cause}`, {
      status: 500,
    })
  }
}
