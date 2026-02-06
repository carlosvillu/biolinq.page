import type { LoaderFunctionArgs, MetaFunction } from 'react-router'
import { data, useLoaderData } from 'react-router'
import type { Route } from './+types/blog.index'
import { useTranslation } from 'react-i18next'
import { detectLocale, parseLangCookie } from '~/lib/i18n'
import { getAllBlogPosts } from '~/services/blog-content.server'
import { BlogHeader } from '~/components/blog/BlogHeader'
import { BlogPostCard } from '~/components/blog/BlogPostCard'

const META_DESCRIPTIONS = {
  en: 'Read the latest tips and guides on link in bio pages, personal branding, and growing your online presence with BioLinq.',
  es: 'Lee los últimos consejos y guías sobre páginas de link in bio, marca personal y cómo hacer crecer tu presencia online con BioLinq.',
} as const

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [{ title: 'Blog - BioLinq' }]
  }

  const title = 'Blog - BioLinq'
  const description = META_DESCRIPTIONS[data.locale] ?? META_DESCRIPTIONS.en
  const url = 'https://biolinq.page/blog'

  return [
    { title },
    { name: 'description', content: description },
    // Open Graph
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: url },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:locale', content: data.locale === 'es' ? 'es_ES' : 'en_US' },
    { property: 'og:locale:alternate', content: data.locale === 'es' ? 'en_US' : 'es_ES' },
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    // Canonical
    { tagName: 'link', rel: 'canonical', href: url },
  ]
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders
}

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get('Cookie')
  const langCookie = parseLangCookie(cookieHeader)
  const locale = detectLocale(request, langCookie)
  const posts = getAllBlogPosts(locale)

  return data(
    { posts, locale },
    { headers: { 'Cache-Control': 'public, max-age=1800, s-maxage=3600' } }
  )
}

export default function BlogIndexPage() {
  const { posts } = useLoaderData<typeof loader>()
  const { t } = useTranslation()

  return (
    <>
      <BlogHeader />
      <section className="max-w-4xl mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <p className="text-center text-dark/60 text-lg font-mono">{t('blog_empty')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
