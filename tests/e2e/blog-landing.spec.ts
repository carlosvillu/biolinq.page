import { test, expect } from '../fixtures/app.fixture'

test.describe('Blog Landing Page', () => {
  test('renders blog header and post cards', async ({ page }) => {
    await page.goto('/blog')

    // Page title contains "Blog"
    await expect(page).toHaveTitle(/Blog/)

    // Blog header is visible with title text
    await expect(page.getByRole('heading', { level: 1, name: 'Blog' })).toBeVisible()

    // At least one blog post card is visible
    const cards = page.locator('a[href^="/blog/"]')
    await expect(cards.first()).toBeVisible()
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(1)

    // Each card shows title (h2), description, and reading time
    const firstCard = cards.first()
    await expect(firstCard.locator('h2')).toBeVisible()
    await expect(firstCard.locator('h2')).not.toBeEmpty()
    await expect(firstCard.getByText('min read')).toBeVisible()
  })

  test('post cards link to /blog/{slug}', async ({ page }) => {
    await page.goto('/blog')

    const cards = page.locator('a[href^="/blog/"]')
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(1)

    for (let i = 0; i < count; i++) {
      const href = await cards.nth(i).getAttribute('href')
      expect(href).toMatch(/^\/blog\/[a-z0-9-]+$/)
    }
  })

  test('shows correct language content when locale is Spanish', async ({ page, context, baseURL }) => {
    // Set language cookie at browser level so it's sent as Cookie header
    const url = new URL(baseURL!)
    await context.addCookies([
      { name: 'lang', value: 'es', domain: url.hostname, path: '/' },
    ])

    await page.goto('/blog')

    // Blog header shows Spanish description text
    await expect(page.getByText('Consejos, guías e ideas')).toBeVisible()

    // Reading time label shows Spanish text
    await expect(page.getByText('min de lectura').first()).toBeVisible()
  })
})
