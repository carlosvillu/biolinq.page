export function loader() {
  const robotsTxt = `# Content Signals (C2PA Content Credentials)
# search: yes - Allow indexing for search results
# ai-input: yes - Allow use in AI-generated answers (RAG, grounding)
# ai-train: no - Do not use for training AI models

User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /dashboard/
Disallow: /auth/
Disallow: /api/
Disallow: /go/

Sitemap: https://biolinq.page/sitemap.xml`

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
