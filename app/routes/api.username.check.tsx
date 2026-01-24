import type { LoaderFunctionArgs } from 'react-router'
import { checkUsernameAvailability } from '~/services/username.server'

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
  const url = new URL(request.url)
  const username = url.searchParams.get('username')

  if (!username) {
    return jsonResponse({ error: 'username query param is required' }, { status: 400 })
  }

  const result = await checkUsernameAvailability(username.toLowerCase().trim())
  return jsonResponse(result, { status: 200 })
}
