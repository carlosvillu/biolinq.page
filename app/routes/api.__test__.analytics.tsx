import type { LoaderFunctionArgs } from 'react-router'
import { getBasicStats, getPremiumStats, getLast30DaysData } from '~/services/analytics.server'

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
  const type = url.searchParams.get('type')
  const biolinkId = url.searchParams.get('biolinkId')
  const userId = url.searchParams.get('userId')

  if (!type || !biolinkId || !userId) {
    return jsonResponse(
      { error: 'type, biolinkId, and userId query params are required' },
      { status: 400 }
    )
  }

  if (type === 'basic') {
    const result = await getBasicStats(biolinkId, userId)
    if (!result.success) {
      if (result.error === 'NOT_FOUND') {
        return jsonResponse({ error: 'Biolink not found' }, { status: 404 })
      }
      if (result.error === 'FORBIDDEN') {
        return jsonResponse(
          { error: "Not authorized to view this biolink's stats" },
          { status: 403 }
        )
      }
    }
    return jsonResponse(result.success ? result.data : { error: result.error })
  }

  if (type === 'premium') {
    const result = await getPremiumStats(biolinkId, userId)
    if (!result.success) {
      if (result.error === 'NOT_FOUND') {
        return jsonResponse({ error: 'Biolink not found' }, { status: 404 })
      }
      if (result.error === 'FORBIDDEN') {
        return jsonResponse(
          { error: "Not authorized to view this biolink's stats" },
          { status: 403 }
        )
      }
      if (result.error === 'PREMIUM_REQUIRED') {
        return jsonResponse({ error: 'Premium subscription required' }, { status: 403 })
      }
    }
    return jsonResponse(result.success ? result.data : { error: result.error })
  }

  if (type === 'chart') {
    const result = await getLast30DaysData(biolinkId, userId)
    if (!result.success) {
      if (result.error === 'NOT_FOUND') {
        return jsonResponse({ error: 'Biolink not found' }, { status: 404 })
      }
      if (result.error === 'FORBIDDEN') {
        return jsonResponse(
          { error: "Not authorized to view this biolink's stats" },
          { status: 403 }
        )
      }
      if (result.error === 'PREMIUM_REQUIRED') {
        return jsonResponse({ error: 'Premium subscription required' }, { status: 403 })
      }
    }
    return jsonResponse(result.success ? result.data : { error: result.error })
  }

  return jsonResponse({ error: 'Invalid type' }, { status: 400 })
}
