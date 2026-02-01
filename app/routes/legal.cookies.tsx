import type { LoaderFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData } from 'react-router'
import { detectLocale, parseLangCookie, type Locale } from '~/lib/i18n'
import { getLegalContent } from '~/services/legal-content.server'
import { LegalPageLayout } from '~/components/legal/LegalPageLayout'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [{ title: 'Cookie Policy | BioLinq' }]
  }

  const title = `${data.title} | BioLinq`
  const url = 'https://biolinq.page/cookies'

  return [
    { title },
    { name: 'description', content: data.description },

    // Open Graph
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: url },
    { property: 'og:title', content: title },
    { property: 'og:description', content: data.description },

    // Twitter Card
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: data.description },

    // Canonical
    { tagName: 'link', rel: 'canonical', href: url },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get('Cookie')
  const langCookie = parseLangCookie(cookieHeader)
  const locale = detectLocale(request, langCookie)
  const content = getLegalContent('cookies', locale as Locale)

  return {
    html: content.html,
    title: content.title,
    description: content.description,
  }
}

export default function CookiesPage() {
  const data = useLoaderData<typeof loader>()

  return <LegalPageLayout html={data.html} title={data.title} />
}
