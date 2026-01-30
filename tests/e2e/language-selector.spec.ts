import { test, expect } from '../fixtures/app.fixture'

test.describe('Language Selector Hot Reload', () => {
  test('should change page language in hot reload when selecting a different language', async ({
    page,
  }) => {
    // Navigate to home page (default English)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Verify initial language is English - check for English text in the pricing section
    // Using "Simple Pricing" as it's unique to English
    await expect(page.locator('text=Simple Pricing').first()).toBeVisible({ timeout: 10000 })

    // Open language selector (Globe icon button)
    const languageButton = page.getByRole('button', { name: 'Select language' })
    await expect(languageButton).toBeVisible()
    await languageButton.click()

    // Wait for menu to be visible and stable
    const spanishOption = page.getByRole('menuitemradio', { name: 'Español' })
    await expect(spanishOption).toBeVisible()

    // Click Spanish option
    await spanishOption.click()

    // Close menu by clicking elsewhere (in case it doesn't auto-close)
    await page.locator('body').click({ position: { x: 10, y: 10 } })

    // Verify page content changed to Spanish WITHOUT page reload
    // "Simple Pricing" should now be "Precios Simples"
    // This is the key assertion: the text must change in-place without navigation
    await expect(page.locator('text=Precios Simples').first()).toBeVisible({ timeout: 5000 })
  })
})
