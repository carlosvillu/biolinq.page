import type { ActionFunctionArgs } from 'react-router'
import { z } from 'zod'
import { updateBiolinkTheme, updateBiolinkColors } from '~/services/theme.server'

const updateThemeRequestSchema = z.object({
  biolinkId: z.string().uuid(),
  theme: z.enum(['brutalist', 'light_minimal', 'dark_mode', 'colorful']),
})

const updateColorsRequestSchema = z.object({
  biolinkId: z.string().uuid(),
  primaryColor: z.string().nullable(),
  bgColor: z.string().nullable(),
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

export async function action({ request }: ActionFunctionArgs) {
  assertTestDbEnabled()

  const url = new URL(request.url)
  const intent = url.searchParams.get('intent')
  const body = await request.json().catch(() => null)

  switch (intent) {
    case 'updateTheme': {
      const parsed = updateThemeRequestSchema.safeParse(body)
      if (!parsed.success) {
        return jsonResponse({ error: 'Invalid request body' }, { status: 400 })
      }

      const result = await updateBiolinkTheme(parsed.data.biolinkId, parsed.data.theme)
      return jsonResponse(result, { status: 200 })
    }

    case 'updateColors': {
      const parsed = updateColorsRequestSchema.safeParse(body)
      if (!parsed.success) {
        return jsonResponse({ error: 'Invalid request body' }, { status: 400 })
      }

      const result = await updateBiolinkColors(parsed.data.biolinkId, {
        primaryColor: parsed.data.primaryColor,
        bgColor: parsed.data.bgColor,
      })
      return jsonResponse(result, { status: 200 })
    }

    default:
      return jsonResponse({ error: 'Invalid intent' }, { status: 400 })
  }
}
