import type { ActionFunctionArgs } from 'react-router'
import { trackView } from '~/services/views.server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value)
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

export function loader() {
  return jsonResponse({ ok: false }, { status: 405 })
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false }, { status: 405 })
  }

  try {
    const body = await request.json()
    const biolinkId = body.id

    if (!biolinkId || typeof biolinkId !== 'string' || !isValidUUID(biolinkId)) {
      return jsonResponse({ ok: false }, { status: 400 })
    }

    await trackView(biolinkId)
    return jsonResponse({ ok: true })
  } catch {
    return jsonResponse({ ok: true })
  }
}
