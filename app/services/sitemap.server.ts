import { db } from '~/db'
import { biolinks } from '~/db/schema/biolinks'
import { getAllBlogPosts } from '~/services/blog-content.server'

interface SitemapUrl {
  loc: string
  priority: number
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  lastmod?: string
}

interface BiolinkForSitemap {
  username: string
  updatedAt: Date
}

const STATIC_PAGES: SitemapUrl[] = [
  { loc: '/', priority: 1.0, changefreq: 'weekly' },
  { loc: '/terms', priority: 0.3, changefreq: 'monthly' },
  { loc: '/privacy', priority: 0.3, changefreq: 'monthly' },
  { loc: '/cookies', priority: 0.3, changefreq: 'monthly' },
  { loc: '/blog/en', priority: 0.7, changefreq: 'weekly' },
  { loc: '/blog/es', priority: 0.7, changefreq: 'weekly' },
]

async function getAllPublicBiolinks(): Promise<BiolinkForSitemap[]> {
  const result = await db
    .select({ username: biolinks.username, updatedAt: biolinks.updatedAt })
    .from(biolinks)
  return result
}

function buildUrlElement(baseUrl: string, url: SitemapUrl): string {
  const lastmodLine = url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : ''
  return `  <url>
    <loc>${baseUrl}${url.loc}</loc>${lastmodLine}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority.toFixed(1)}</priority>
  </url>`
}

export async function generateSitemap(baseUrl: string): Promise<string> {
  const biolinksList = await getAllPublicBiolinks()

  const dynamicPages: SitemapUrl[] = biolinksList.map((biolink) => ({
    loc: `/${biolink.username}`,
    priority: 0.6,
    changefreq: 'weekly' as const,
    lastmod: biolink.updatedAt.toISOString().split('T')[0],
  }))

  const blogPages: SitemapUrl[] = []
  for (const locale of ['en', 'es'] as const) {
    const blogPosts = getAllBlogPosts(locale)
    for (const post of blogPosts) {
      blogPages.push({
        loc: `/blog/${locale}/${post.slug}`,
        priority: 0.5,
        changefreq: 'monthly' as const,
        lastmod: post.updatedDate ?? post.date,
      })
    }
  }

  const allUrls = [...STATIC_PAGES, ...dynamicPages, ...blogPages]
  const urlElements = allUrls.map((url) => buildUrlElement(baseUrl, url)).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`
}
