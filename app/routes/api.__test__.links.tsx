import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { z } from 'zod'
import {
  getLinksByBiolinkId,
  createLink,
  deleteLink,
  reorderLinks,
} from '~/services/links.server'

const createLinkRequestSchema = z.object({
  userId: z.string().uuid(),
  biolinkId: z.string().uuid(),
  emoji: z.string().optional(),
  title: z.string(),
  url: z.string(),
})

const deleteLinkRequestSchema = z.object({
  userId: z.string().uuid(),
  linkId: z.string().uuid(),
})

const reorderLinksRequestSchema = z.object({
  userId: z.string().uuid(),
  biolinkId: z.string().uuid(),
  linkIds: z.array(z.string().uuid()),
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
      ...init?.headers,
    },
  })
}

export async function loader({ request }: LoaderFunctionArgs) {
  assertTestDbEnabled()

  const url = new URL(request.url)
  const userId = url.searchParams.get('userId')
  const biolinkId = url.searchParams.get('biolinkId')

  if (!userId || !biolinkId) {
    return jsonResponse(
      { error: 'userId and biolinkId query params are required' },
      { status: 400 }
    )
  }

  const result = await getLinksByBiolinkId(userId, biolinkId)
  return jsonResponse(result, { status: 200 })
}

export async function action({ request }: ActionFunctionArgs) {
  assertTestDbEnabled()

  const body = await request.json().catch(() => null)

  switch (request.method) {
    case 'POST': {
      const parsed = createLinkRequestSchema.safeParse(body)
      if (!parsed.success) {
        return jsonResponse({ error: 'Invalid request body' }, { status: 400 })
      }

      try {
        const result = await createLink(parsed.data.userId, parsed.data.biolinkId, {
          emoji: parsed.data.emoji,
          title: parsed.data.title,
          url: parsed.data.url,
        })
        return jsonResponse(result, { status: 200 })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return new Response(`Unexpected Server Error\n\nError: ${message}`, {
          status: 500,
        })
      }
    }

    case 'DELETE': {
      const parsed = deleteLinkRequestSchema.safeParse(body)
      if (!parsed.success) {
        return jsonResponse({ error: 'Invalid request body' }, { status: 400 })
      }

      try {
        const result = await deleteLink(parsed.data.userId, parsed.data.linkId)
        return jsonResponse(result, { status: 200 })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return new Response(`Unexpected Server Error\n\nError: ${message}`, {
          status: 500,
        })
      }
    }

    case 'PATCH': {
      const parsed = reorderLinksRequestSchema.safeParse(body)
      if (!parsed.success) {
        return jsonResponse({ error: 'Invalid request body' }, { status: 400 })
      }

      try {
        const result = await reorderLinks(
          parsed.data.userId,
          parsed.data.biolinkId,
          parsed.data.linkIds
        )
        return jsonResponse(result, { status: 200 })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return new Response(`Unexpected Server Error\n\nError: ${message}`, {
          status: 500,
        })
      }
    }

    default:
      return jsonResponse({ error: 'Method Not Allowed' }, { status: 405 })
  }
}
