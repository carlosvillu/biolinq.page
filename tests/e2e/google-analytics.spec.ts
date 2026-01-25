import { test, expect } from '../fixtures/app.fixture'

test.describe('Google Analytics 4 Integration', () => {
  test.beforeEach(async ({ context }) => {
    // Accept analytics consent so GA loads
    await context.addInitScript(() => {
      localStorage.setItem('biolinq_analytics_consent', 'accepted')
    })
  })

  test('GA4 script loads when measurement ID is configured', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    // Verify gtag.js script is present
    const gtagScript = page.locator('script[src*="googletagmanager.com/gtag/js"]')
    await expect(gtagScript).toHaveCount(1)

    // Verify the script src contains the measurement ID
    const src = await gtagScript.getAttribute('src')
    expect(src).toContain('G-TESTMEASURE')

    // Verify dataLayer is defined
    const hasDataLayer = await page.evaluate(() => {
      return Array.isArray((window as unknown as { dataLayer?: unknown[] }).dataLayer)
    })
    expect(hasDataLayer).toBe(true)

    // Verify gtag function is defined
    const hasGtag = await page.evaluate(() => {
      return typeof (window as unknown as { gtag?: unknown }).gtag === 'function'
    })
    expect(hasGtag).toBe(true)
  })

  test('environment user property is set correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    // Check dataLayer for user_properties set call
    // gtag() pushes an Arguments object to dataLayer, not a plain array
    const hasEnvironmentProperty = await page.evaluate(() => {
      const dataLayer = (window as unknown as { dataLayer?: unknown[] }).dataLayer
      if (!Array.isArray(dataLayer)) return false

      // Look for the set command with user_properties
      return dataLayer.some((entry) => {
        // Convert Arguments object to array if needed
        const args = Array.from(entry as ArrayLike<unknown>)
        return args[0] === 'set' && args[1] === 'user_properties' && (args[2] as Record<string, unknown>)?.environment
      })
    })
    expect(hasEnvironmentProperty).toBe(true)
  })

  test('pageview event is sent on SPA navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    // Get initial dataLayer length
    const initialLength = await page.evaluate(() => {
      return ((window as unknown as { dataLayer?: unknown[] }).dataLayer || []).length
    })

    // Navigate to login page (SPA navigation) - click the login link in header
    await page.locator('header a[href="/auth/login"]').click()
    await page.waitForURL('**/auth/login')

    // Wait a bit for the pageview to be tracked
    await page.waitForTimeout(500)

    // Check that dataLayer has new entries with the new path
    const hasNewPageview = await page.evaluate(
      ({ initialLen }) => {
        const dataLayer = (window as unknown as { dataLayer?: unknown[] }).dataLayer
        if (!Array.isArray(dataLayer)) return false

        // Look for config call with page_path containing /auth/login
        const newEntries = dataLayer.slice(initialLen)
        return newEntries.some((entry) => {
          // Convert Arguments object to array if needed
          const args = Array.from(entry as ArrayLike<unknown>)
          // gtag('config', 'G-XXX', { page_path: '/auth/login' })
          return (
            args[0] === 'config' &&
            typeof args[2] === 'object' &&
            (args[2] as Record<string, unknown>)?.page_path?.toString().includes('/auth/login')
          )
        })
      },
      { initialLen: initialLength }
    )
    expect(hasNewPageview).toBe(true)
  })
})
