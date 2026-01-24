import type { ActionFunctionArgs } from 'react-router'
import { z } from 'zod'
import { requireAuth } from '~/lib/auth.server'
import { registerUsername } from '~/services/username.server'

const claimSchema = z.object({
  username: z.string(),
})

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

export async function action({ request }: ActionFunctionArgs) {
  const { user } = await requireAuth(request)

  if (request.method !== 'POST') {
    return jsonResponse({ success: false, error: 'METHOD_NOT_ALLOWED' }, { status: 405 })
  }

  const body = await request.json().catch(() => null)
  const parsed = claimSchema.safeParse(body)

  if (!parsed.success) {
    return jsonResponse({ success: false, error: 'USERNAME_REQUIRED' }, { status: 400 })
  }

  const result = await registerUsername(user.id, parsed.data.username.toLowerCase().trim())
  return jsonResponse(result, { status: 200 })
}
