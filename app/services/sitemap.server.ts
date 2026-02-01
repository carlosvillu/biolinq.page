import { db } from '~/db'
import { biolinks } from '~/db/schema/biolinks'

interface SitemapUrl {
  loc: string
  priority: number
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
}

const STATIC_PAGES: SitemapUrl[] = [
  { loc: '/', priority: 1.0, changefreq: 'weekly' },
  { loc: '/terms', priority: 0.3, changefreq: 'monthly' },
  { loc: '/privacy', priority: 0.3, changefreq: 'monthly' },
  { loc: '/cookies', priority: 0.3, changefreq: 'monthly' },
]

async function getAllPublicUsernames(): Promise<string[]> {
  const result = await db.select({ username: biolinks.username }).from(biolinks)
  return result.map((r) => r.username)
}

function buildUrlElement(baseUrl: string, url: SitemapUrl): string {
  return `  <url>
    <loc>${baseUrl}${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority.toFixed(1)}</priority>
  </url>`
}

export async function generateSitemap(baseUrl: string): Promise<string> {
  const usernames = await getAllPublicUsernames()

  const dynamicPages: SitemapUrl[] = usernames.map((username) => ({
    loc: `/${username}`,
    priority: 0.6,
    changefreq: 'weekly' as const,
  }))

  const allUrls = [...STATIC_PAGES, ...dynamicPages]
  const urlElements = allUrls.map((url) => buildUrlElement(baseUrl, url)).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`
}
