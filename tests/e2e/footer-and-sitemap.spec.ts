import { test, expect } from '../fixtures/app.fixture'

test.describe('Footer blog link', () => {
  test('footer contains a visible Blog link pointing to /blog', async ({ page }) => {
    await page.goto('/')

    const footer = page.locator('footer')
    const blogLink = footer.locator('a[href="/blog"]')

    await expect(blogLink).toBeVisible()
    await expect(blogLink).toHaveText('Blog')
  })
})

test.describe('Sitemap includes blog URLs', () => {
  test('sitemap contains /blog landing and individual blog post URLs', async ({ baseURL }) => {
    const res = await fetch(`${baseURL}/sitemap.xml`)
    expect(res.ok).toBe(true)

    const xml = await res.text()

    // /blog landing page is present with weekly changefreq
    expect(xml).toContain('/blog</loc>')
    expect(xml).toMatch(/<url>[^]*?\/blog<\/loc>[^]*?<changefreq>weekly<\/changefreq>[^]*?<\/url>/)

    // At least one blog post URL is present with monthly changefreq
    expect(xml).toMatch(/\/blog\/[a-z0-9-]+<\/loc>/)
    expect(xml).toMatch(
      /<url>[^]*?\/blog\/[a-z0-9-]+<\/loc>[^]*?<changefreq>monthly<\/changefreq>[^]*?<\/url>/
    )
  })
})
