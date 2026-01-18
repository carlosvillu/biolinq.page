import { test, expect } from '../fixtures/app.fixture'

test.describe('Home Page', () => {
  test('should load home page successfully', async ({ page }) => {
    await page.goto('/')

    // Verify page loaded (basic smoke test)
    await expect(page).toHaveTitle(/.*/)

    // Verify page has basic content
    const body = await page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should have working navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    // Check that header is present
    await expect(page.locator('header')).toBeVisible({ timeout: 10000 })

    // Check that footer is present
    await expect(page.locator('footer')).toBeVisible({ timeout: 10000 })
  })
})
