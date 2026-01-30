import { test, expect } from '../fixtures'

const PRIVACY_PATH = '/privacy'

test.describe('Privacy Policy page', () => {
  test('renders English privacy policy by default', async ({ page }) => {
    await page.goto(PRIVACY_PATH)

    // Verify page title and heading
    await expect(page).toHaveTitle(/Privacy Policy/)
    await expect(page.getByRole('heading', { name: 'Privacy Policy', level: 1 })).toBeVisible()

    // Verify content from privacy.md (first H2 heading in English version)
    await expect(page.getByRole('heading', { name: /Information We Collect/, level: 2 })).toBeVisible()

    // Verify Neo-Brutal card styling is applied
    await expect(page.locator('article')).toBeVisible()
  })

  test('renders Spanish privacy policy when lang cookie is es', async ({ page, context }) => {
    // Set Spanish language cookie
    await context.addCookies([
      {
        name: 'lang',
        value: 'es',
        domain: 'localhost',
        path: '/'
      }
    ])

    await page.goto(PRIVACY_PATH)

    // Verify page title and heading in Spanish
    await expect(page).toHaveTitle(/Política de Privacidad/)
    await expect(page.getByRole('heading', { name: 'Política de Privacidad', level: 1 })).toBeVisible()

    // Verify content from Spanish privacy.md (first H2 heading in Spanish version)
    await expect(page.getByRole('heading', { name: /Información que Recopilamos/, level: 2 })).toBeVisible()
  })

  test('sets meta tags correctly', async ({ page }) => {
    await page.goto(PRIVACY_PATH)

    // Verify title tag
    await expect(page).toHaveTitle('Privacy Policy | BioLinq')

    // Verify meta description exists and has content
    const metaDescription = page.locator('meta[name="description"]')
    await expect(metaDescription).toHaveAttribute('content', /.+/)
  })

  test('footer link navigates to privacy page', async ({ page }) => {
    await page.goto('/')

    // Dismiss cookie banner if present (same pattern as terms test)
    try {
      const rejectButton = page.getByRole('button', { name: /reject|rechazar/i })
      await rejectButton.click({ timeout: 2000 })
      await expect(rejectButton).not.toBeVisible()
    } catch {
      // Banner might not be visible, continue
    }

    // Use force click as fallback if banner intercepts
    await page.getByRole('link', { name: /privacy/i }).click({ force: true })

    // Verify navigation to privacy page
    await expect(page).toHaveURL(PRIVACY_PATH)
    await expect(page.getByRole('heading', { name: 'Privacy Policy', level: 1 })).toBeVisible()
  })
})
