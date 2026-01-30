import type { LoaderFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData } from 'react-router'
import { detectLocale, parseLangCookie, type Locale } from '~/lib/i18n'
import { getLegalContent } from '~/services/legal-content.server'
import { LegalPageLayout } from '~/components/legal/LegalPageLayout'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [{ title: 'Cookie Policy | BioLinq' }]
  }

  return [
    { title: `${data.title} | BioLinq` },
    { name: 'description', content: data.description },
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
