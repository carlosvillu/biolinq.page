import { type ActionFunctionArgs, data } from 'react-router'
import { trackView } from '~/services/views.server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value)
}

export function loader() {
  return data({ ok: false }, { status: 405 })
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return data({ ok: false }, { status: 405 })
  }

  try {
    const body = await request.json()
    const biolinkId = body.id

    if (!biolinkId || typeof biolinkId !== 'string' || !isValidUUID(biolinkId)) {
      return data({ ok: false }, { status: 400 })
    }

    await trackView(biolinkId)
    return data({ ok: true })
  } catch {
    return data({ ok: true })
  }
}
