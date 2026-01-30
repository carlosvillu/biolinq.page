import type { LoaderFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData } from 'react-router'
import { detectLocale, parseLangCookie, type Locale } from '~/lib/i18n'
import { getLegalContent } from '~/services/legal-content.server'
import { LegalPageLayout } from '~/components/legal/LegalPageLayout'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [{ title: 'Privacy Policy | BioLinq' }]
  }

  return [
    { title: `${data.title} | BioLinq` },
    { name: 'description', content: data.description }
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  // 1. Detect locale from cookie or Accept-Language header
  const cookieHeader = request.headers.get('Cookie')
  const langCookie = parseLangCookie(cookieHeader)
  const locale = detectLocale(request, langCookie)

  // 2. Load legal content for 'privacy' page
  const content = getLegalContent('privacy', locale as Locale)

  // 3. Return structured data for SSR
  return {
    html: content.html,
    title: content.title,
    description: content.description
  }
}

export default function PrivacyPage() {
  const data = useLoaderData<typeof loader>()

  // Render legal page layout with loaded content
  return <LegalPageLayout html={data.html} title={data.title} />
}
