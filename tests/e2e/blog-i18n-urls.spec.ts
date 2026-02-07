import { test, expect } from '../fixtures/app.fixture'

test.describe('Blog I18n URLs', () => {
  test('blog landing /blog/en renders with English content', async ({ page }) => {
    await page.goto('/blog/en')

    await expect(page.getByRole('heading', { level: 1, name: 'Blog' })).toBeVisible()
    const cards = page.locator('a[href^="/blog/en/"]')
    await expect(cards.first()).toBeVisible()
  })

  test('blog landing /blog/es shows Spanish content', async ({ page, context, baseURL }) => {
    const url = new URL(baseURL!)
    await context.addCookies([
      { name: 'lang', value: 'es', domain: url.hostname, path: '/' },
    ])

    await page.goto('/blog/es')

    // Blog header shows Spanish text
    await expect(page.getByText('Consejos, guías e ideas')).toBeVisible()

    // Post card links include /blog/es/ prefix
    const cards = page.locator('a[href^="/blog/es/"]')
    await expect(cards.first()).toBeVisible()
  })

  test('blog post card links include language prefix', async ({ page }) => {
    await page.goto('/blog/en')

    const cards = page.locator('a[href^="/blog/en/"]')
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(1)

    for (let i = 0; i < count; i++) {
      const href = await cards.nth(i).getAttribute('href')
      expect(href).toMatch(/^\/blog\/en\/[a-z0-9-]+$/)
    }
  })

  test('blog post renders at /blog/en/:slug', async ({ page }) => {
    await page.goto('/blog/en/seed-post-alpha')

    await expect(page).toHaveTitle(/Alpha Post.*BioLinq Blog/)
    await expect(
      page.getByRole('heading', { level: 1, name: /Alpha Post/ })
    ).toBeVisible()
    await expect(page.getByText('Test Author')).toBeVisible()
  })

  test('blog post renders at /blog/es/:slug', async ({ page, context, baseURL }) => {
    const url = new URL(baseURL!)
    await context.addCookies([
      { name: 'lang', value: 'es', domain: url.hostname, path: '/' },
    ])

    await page.goto('/blog/es/seed-post-alpha')

    await expect(page).toHaveTitle(/Post Alpha.*BioLinq Blog/)
    await expect(page.getByText('Autor de Prueba')).toBeVisible()
  })

  test('language switch on blog post navigates to translated URL', async ({ page }) => {
    await page.goto('/blog/en/seed-post-alpha')

    // Open language selector and switch to Spanish
    await page.getByRole('button', { name: 'Select language' }).click()
    await page.getByText('Español').click()

    // URL should change to /blog/es/seed-post-alpha
    await page.waitForURL(/\/blog\/es\/seed-post-alpha/)
    await expect(page.getByText('Autor de Prueba')).toBeVisible()
  })

  test('language switch on blog index navigates to /blog/{newLang}', async ({ page }) => {
    await page.goto('/blog/en')

    // Open language selector and switch to Spanish
    await page.getByRole('button', { name: 'Select language' }).click()
    await page.getByText('Español').click()

    // URL should change to /blog/es
    await page.waitForURL(/\/blog\/es$/)
    await expect(page.getByText('Consejos, guías e ideas')).toBeVisible()
  })

  test('blog post SEO meta tags use new URL format', async ({ page }) => {
    await page.goto('/blog/en/seed-post-alpha')

    // Canonical contains /blog/en/seed-post-alpha
    const canonical = page.locator('link[rel="canonical"]')
    await expect(canonical).toHaveAttribute(
      'href',
      'https://biolinq.page/blog/en/seed-post-alpha'
    )

    // Hreflang alternates point to /blog/en/... and /blog/es/...
    const hreflangEn = page.locator('link[rel="alternate"][hreflang="en"]')
    await expect(hreflangEn).toHaveAttribute(
      'href',
      /^https:\/\/biolinq\.page\/blog\/en\//
    )

    const hreflangEs = page.locator('link[rel="alternate"][hreflang="es"]')
    await expect(hreflangEs).toHaveAttribute(
      'href',
      /^https:\/\/biolinq\.page\/blog\/es\//
    )
  })

  test('404 for invalid language code', async ({ page }) => {
    const response = await page.goto('/blog/fr/seed-post-alpha')
    expect(response?.status()).toBe(404)
  })

  test('404 for non-existent post slug', async ({ page }) => {
    const response = await page.goto('/blog/en/this-post-does-not-exist')
    expect(response?.status()).toBe(404)
  })
})
