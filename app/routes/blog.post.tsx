import type { LoaderFunctionArgs, MetaFunction } from 'react-router'
import { data, useLoaderData } from 'react-router'
import type { Route } from './+types/blog.post'
import { isValidLocale } from '~/lib/i18n'
import {
  getBlogPost,
  getBlogPostRawMarkdown,
  getRelatedPosts,
  getTranslationSlugs,
} from '~/services/blog-content.server'
import { BlogPostLayout } from '~/components/blog/BlogPostLayout'
import { RelatedPosts } from '~/components/blog/RelatedPosts'

const BLOG_CACHE_CONTROL = 'public, max-age=3600, s-maxage=86400'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data || typeof data !== 'object' || !('post' in data)) {
    return [{ title: 'Not Found - BioLinq' }]
  }

  const { post, locale, translationSlugs } = data
  const title = `${post.meta.title} - BioLinq Blog`
  const description = post.meta.description
  const url = `https://biolinq.page/blog/${locale}/${post.meta.slug}`
  const canonicalUrl = `https://biolinq.page/blog/en/${post.meta.canonicalSlug}`
  const ogLocale = locale === 'es' ? 'es_ES' : 'en_US'
  const ogLocaleAlt = locale === 'es' ? 'en_US' : 'es_ES'

  const enSlug = translationSlugs.en ?? post.meta.canonicalSlug
  const esSlug = translationSlugs.es ?? enSlug

  return [
    { title },
    { name: 'description', content: description },
    { name: 'robots', content: 'index, follow' },
    // Open Graph
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: url },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: post.meta.coverImage },
    { property: 'og:locale', content: ogLocale },
    { property: 'og:locale:alternate', content: ogLocaleAlt },
    { property: 'article:published_time', content: post.meta.date },
    ...post.meta.tags.map((tag) => ({ property: 'article:tag', content: tag })),
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: post.meta.coverImage },
    // Canonical + hreflang
    { tagName: 'link', rel: 'canonical', href: canonicalUrl },
    {
      tagName: 'link',
      rel: 'alternate',
      hrefLang: 'en',
      href: `https://biolinq.page/blog/en/${enSlug}`,
    },
    {
      tagName: 'link',
      rel: 'alternate',
      hrefLang: 'es',
      href: `https://biolinq.page/blog/es/${esSlug}`,
    },
    // Schema.org JSON-LD
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description,
        image: post.meta.coverImage,
        datePublished: post.meta.date,
        dateModified: post.meta.updatedDate ?? post.meta.date,
        author: { '@type': 'Person', name: post.meta.author },
        publisher: { '@type': 'Organization', name: 'BioLinq' },
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
      },
    },
  ]
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const lang = params.lang!
  const slug = params.slug!
  if (!isValidLocale(lang)) {
    throw new Response(null, { status: 404 })
  }
  const locale = lang

  const contentTypeHeader = request.headers.get('content-type')?.toLowerCase() ?? ''
  const acceptHeader = request.headers.get('accept')?.toLowerCase() ?? ''
  const wantsMarkdown =
    contentTypeHeader.includes('text/markdown') || acceptHeader.includes('text/markdown')

  if (wantsMarkdown) {
    const rawPost = getBlogPostRawMarkdown(slug, locale)
    if (!rawPost) {
      throw new Response(null, { status: 404 })
    }

    return new Response(rawPost.markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': BLOG_CACHE_CONTROL,
        'X-Robots-Tag': 'noindex',
      },
    })
  }

  const post = getBlogPost(slug, locale)
  if (!post) {
    throw new Response(null, { status: 404 })
  }

  const relatedPosts = getRelatedPosts(slug, post.meta.tags, locale, 3)
  const translationSlugs = getTranslationSlugs(post.meta.canonicalSlug)

  return data(
    { post, relatedPosts, locale, translationSlugs },
    { headers: { 'Cache-Control': BLOG_CACHE_CONTROL } }
  )
}

export default function BlogPostPage() {
  const loaderData = useLoaderData<typeof loader>()

  if (!loaderData || typeof loaderData !== 'object' || !('post' in loaderData)) {
    return null
  }

  const { post, relatedPosts, locale } = loaderData

  return (
    <>
      <BlogPostLayout html={post.html} meta={post.meta} />
      <RelatedPosts posts={relatedPosts} lang={locale} />
    </>
  )
}
