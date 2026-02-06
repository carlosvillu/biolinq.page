import { test, expect } from '../fixtures/app.fixture'

test.describe('Blog Post Page', () => {
  test('renders with correct content', async ({ page }) => {
    await page.goto('/blog/seed-post-alpha')

    // Page title contains post title and "BioLinq Blog"
    await expect(page).toHaveTitle(/Alpha Post.*BioLinq Blog/)

    // H1 heading with post title
    await expect(
      page.getByRole('heading', { level: 1, name: /Alpha Post/ })
    ).toBeVisible()

    // Author name
    await expect(page.getByText('Test Author')).toBeVisible()

    // Reading time
    await expect(page.getByText('5 min read').first()).toBeVisible()

    // Tags as badges (scoped to header to avoid duplicates in related posts)
    const header = page.locator('header')
    await expect(header.getByText('LINK-IN-BIO')).toBeVisible()
    await expect(header.getByText('PERSONAL-BRANDING')).toBeVisible()

    // Article content contains "Introduction" heading
    await expect(
      page.getByRole('heading', { level: 2, name: 'Introduction' })
    ).toBeVisible()

    // .neo-article container is present
    await expect(page.locator('.neo-article')).toBeVisible()
  })

  test('shows proper SEO meta tags', async ({ page }) => {
    await page.goto('/blog/seed-post-alpha')

    // <title> contains post title and "BioLinq Blog"
    await expect(page).toHaveTitle(/Alpha Post.*BioLinq Blog/)

    // <meta name="description">
    const description = page.locator('meta[name="description"]')
    await expect(description).toHaveAttribute('content', /link in bio/)

    // <meta name="robots">
    const robots = page.locator('meta[name="robots"]')
    await expect(robots).toHaveAttribute('content', 'index, follow')

    // <meta property="og:type">
    const ogType = page.locator('meta[property="og:type"]')
    await expect(ogType).toHaveAttribute('content', 'article')

    // <meta property="og:title">
    const ogTitle = page.locator('meta[property="og:title"]')
    await expect(ogTitle).toHaveAttribute('content', /Alpha Post/)

    // <meta property="og:image">
    const ogImage = page.locator('meta[property="og:image"]')
    await expect(ogImage).toHaveAttribute('content', /.+/)

    // <meta property="article:published_time">
    const pubTime = page.locator('meta[property="article:published_time"]')
    await expect(pubTime).toHaveAttribute('content', '2026-01-15')

    // <link rel="canonical">
    const canonical = page.locator('link[rel="canonical"]')
    await expect(canonical).toHaveAttribute(
      'href',
      'https://biolinq.page/blog/seed-post-alpha'
    )

    // Schema.org JSON-LD
    const jsonLdScripts = page.locator('script[type="application/ld+json"]')
    const count = await jsonLdScripts.count()
    let jsonLdContent: string | null = null
    for (let i = 0; i < count; i++) {
      const text = await jsonLdScripts.nth(i).textContent()
      if (text?.includes('BlogPosting')) {
        jsonLdContent = text
        break
      }
    }
    expect(jsonLdContent).toBeTruthy()
    const parsed = JSON.parse(jsonLdContent!)
    expect(parsed['@type']).toBe('BlogPosting')
    expect(parsed.headline).toContain('Alpha Post')
  })

  test('related posts section renders', async ({ page }) => {
    await page.goto('/blog/seed-post-alpha')

    // "Related Posts" heading is visible
    await expect(
      page.getByRole('heading', { level: 2, name: 'Related Posts' })
    ).toBeVisible()

    // At least one related post card (beta shares "link-in-bio" tag)
    const relatedCards = page.locator('section a[href^="/blog/"]')
    await expect(relatedCards.first()).toBeVisible()
    const count = await relatedCards.count()
    expect(count).toBeGreaterThanOrEqual(1)

    // Related post cards link to /blog/{slug}
    for (let i = 0; i < count; i++) {
      const href = await relatedCards.nth(i).getAttribute('href')
      expect(href).toMatch(/^\/blog\/[a-z0-9-]+$/)
    }

    // CTA button is visible and links to /
    const ctaLink = page.getByRole('link', { name: /Create your free BioLinq/ })
    await expect(ctaLink).toBeVisible()
    await expect(ctaLink).toHaveAttribute('href', '/')
  })

  test('404 for non-existent post slug', async ({ page }) => {
    const response = await page.goto('/blog/this-post-does-not-exist')

    // Response status is 404
    expect(response?.status()).toBe(404)

    // Page does not render a blog post layout
    await expect(page.locator('.neo-article')).not.toBeVisible()
  })
})
