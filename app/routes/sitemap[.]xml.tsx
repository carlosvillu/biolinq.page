import { generateSitemap } from '~/services/sitemap.server'

export async function loader() {
  const xml = await generateSitemap('https://biolinq.page')

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
