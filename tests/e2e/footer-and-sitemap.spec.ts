import { test, expect } from '../fixtures/app.fixture'

test.describe('Footer blog link', () => {
  test('footer contains a visible Blog link pointing to /blog/en', async ({ page }) => {
    await page.goto('/')

    const footer = page.locator('footer')
    const blogLink = footer.locator('a[href="/blog/en"]')

    await expect(blogLink).toBeVisible()
    await expect(blogLink).toHaveText('Blog')
  })
})

test.describe('Sitemap includes blog URLs', () => {
  test('sitemap contains /blog landing and individual blog post URLs', async ({ baseURL }) => {
    const res = await fetch(`${baseURL}/sitemap.xml`)
    expect(res.ok).toBe(true)

    const xml = await res.text()

    // /blog/en and /blog/es landing pages are present with weekly changefreq
    expect(xml).toContain('/blog/en</loc>')
    expect(xml).toContain('/blog/es</loc>')
    expect(xml).toMatch(/<url>[^]*?\/blog\/en<\/loc>[^]*?<changefreq>weekly<\/changefreq>[^]*?<\/url>/)

    // At least one blog post URL is present with /blog/{lang}/{slug} format and monthly changefreq
    expect(xml).toMatch(/\/blog\/en\/[a-z0-9-]+<\/loc>/)
    expect(xml).toMatch(
      /<url>[^]*?\/blog\/en\/[a-z0-9-]+<\/loc>[^]*?<changefreq>monthly<\/changefreq>[^]*?<\/url>/
    )
  })
})
