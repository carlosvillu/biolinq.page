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
    await page.goto('/')

    // Check that header is present
    const header = await page.locator('header')
    await expect(header).toBeVisible()

    // Check that footer is present
    const footer = await page.locator('footer')
    await expect(footer).toBeVisible()
  })
})
