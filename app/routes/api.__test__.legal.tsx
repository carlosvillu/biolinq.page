import type { LoaderFunctionArgs } from 'react-router'
import { getLegalContent, type LegalPage, type Locale } from '~/services/legal-content.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const page = url.searchParams.get('page') as LegalPage | null
  const locale = url.searchParams.get('locale') as Locale | null

  if (!page || !locale) {
    return Response.json({ error: 'Missing page or locale parameter' }, { status: 400 })
  }

  try {
    const content = getLegalContent(page, locale)
    return Response.json(content)
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
