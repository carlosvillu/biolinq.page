import type { ActionFunctionArgs } from 'react-router'
import { z } from 'zod'
import { auth } from '~/lib/auth'
import { createFeedback } from '~/services/feedback.server'
import { ALLOWED_EMOJIS } from '~/db/schema/feedback'

const feedbackSchema = z.object({
  emoji: z.string().refine((val) => ALLOWED_EMOJIS.includes(val as (typeof ALLOWED_EMOJIS)[number]), {
    message: 'Invalid emoji',
  }),
  text: z.string().optional().nullable(),
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
  if (request.method !== 'POST') {
    return jsonResponse({ success: false, error: 'METHOD_NOT_ALLOWED' }, { status: 405 })
  }

  const body = await request.json().catch(() => null)
  const parsed = feedbackSchema.safeParse(body)

  if (!parsed.success) {
    return jsonResponse({ success: false, error: 'INVALID_DATA' }, { status: 400 })
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  })

  const referer = request.headers.get('Referer')
  const page = referer ? new URL(referer).pathname : null

  const result = await createFeedback({
    emoji: parsed.data.emoji as (typeof ALLOWED_EMOJIS)[number],
    text: parsed.data.text,
    userId: session?.user?.id ?? null,
    page,
  })

  if (!result.success) {
    return jsonResponse({ success: false, error: result.error }, { status: 400 })
  }

  return jsonResponse({ success: true, feedbackId: result.feedbackId }, { status: 201 })
}
