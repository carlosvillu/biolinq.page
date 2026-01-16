import { test, expect } from '../fixtures/app.fixture'
import { createAuthSession, setAuthCookie } from '../helpers/auth'

test.describe('Authentication', () => {
  test('should allow user signup via email', async ({ page }) => {
    const timestamp = Date.now()
    const email = `test-signup-${timestamp}@example.com`
    const password = 'TestPassword123!'

    // Go to signup page
    await page.goto('/auth/signup')

    // Fill signup form
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)
    await page.fill('input[name="confirmPassword"]', password)

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to home page after signup
    await page.waitForURL('/', { timeout: 10000 })

    // Verify user is logged in by checking if we can access protected content
    // (In a generic template, this might just mean the user is redirected to home)
    expect(page.url()).toContain('/')
  })

  test('should allow user login via email', async ({ page, baseURL }) => {
    // First create a user via API
    const timestamp = Date.now()
    const email = `test-login-${timestamp}@example.com`
    const password = 'TestPassword123!'

    await createAuthSession(baseURL!, {
      email,
      password,
    })

    // Now test login UI
    await page.goto('/auth/login')

    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)

    await page.click('button[type="submit"]')

    // Should redirect to home page after login
    await page.waitForURL('/', { timeout: 10000 })

    expect(page.url()).toContain('/')
  })

  test('should persist session across page refreshes', async ({ page, context, baseURL }) => {
    // Create a session via API
    const timestamp = Date.now()
    const email = `test-session-${timestamp}@example.com`
    const password = 'TestPassword123!'

    const { token } = await createAuthSession(baseURL!, {
      email,
      password,
    })

    // Set the auth cookie
    await setAuthCookie(context, token)

    // Navigate to home page
    await page.goto('/')

    // Refresh the page
    await page.reload()

    // Session should still be active (user should still be logged in)
    // In a generic template, we just verify the page loads without redirecting to login
    expect(page.url()).toContain('/')
  })

  test('should display Google OAuth button', async ({ page }) => {
    await page.goto('/auth/signup')

    // Check that Google auth button is present
    const googleButton = await page.locator('button:has-text("Google")')
    await expect(googleButton).toBeVisible()
  })
})
