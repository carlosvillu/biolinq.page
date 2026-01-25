import { test, expect } from '../fixtures'

test.describe('Cookie Consent Banner', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to simulate new user
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('GA does not load without consent', async ({ page }) => {
    await page.goto('/')

    // Verify banner is visible
    const banner = page.getByText('We use cookies for analytics')
    await expect(banner).toBeVisible()

    // Verify Accept and Reject buttons are visible
    await expect(page.getByRole('button', { name: 'Accept All' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reject All' })).toBeVisible()

    // Verify GA script is NOT loaded
    const gtagScript = await page.evaluate(() => {
      return document.querySelector('script[src*="googletagmanager.com/gtag/js"]')
    })
    expect(gtagScript).toBeNull()

    // Verify window.gtag is undefined
    const gtagDefined = await page.evaluate(
      () => typeof (window as unknown as { gtag?: unknown }).gtag !== 'undefined'
    )
    expect(gtagDefined).toBe(false)
  })

  test('consent is persisted after accepting', async ({ page }) => {
    await page.goto('/')

    // Verify banner is visible
    await expect(page.getByText('We use cookies for analytics')).toBeVisible()

    // Click Accept All
    await page.getByRole('button', { name: 'Accept All' }).click()

    // Wait for banner to disappear
    await expect(page.getByText('We use cookies for analytics')).not.toBeVisible()

    // Verify consent is stored in localStorage
    const storedConsent = await page.evaluate(() => localStorage.getItem('biolinq_analytics_consent'))
    expect(storedConsent).toBe('accepted')

    // Refresh the page
    await page.reload()

    // Verify banner does NOT appear (preference saved)
    await expect(page.getByText('We use cookies for analytics')).not.toBeVisible()

    // Verify consent is still stored
    const storedConsentAfterReload = await page.evaluate(
      () => localStorage.getItem('biolinq_analytics_consent')
    )
    expect(storedConsentAfterReload).toBe('accepted')
  })

  test('GA does not load after rejection', async ({ page }) => {
    await page.goto('/')

    // Click Reject All
    await page.getByRole('button', { name: 'Reject All' }).click()

    // Verify banner disappears
    await expect(page.getByText('We use cookies for analytics')).not.toBeVisible()

    // Verify GA script is NOT loaded
    const gtagScript = await page.evaluate(() => {
      return document.querySelector('script[src*="googletagmanager.com/gtag/js"]')
    })
    expect(gtagScript).toBeNull()

    // Refresh the page
    await page.reload()

    // Verify banner does NOT appear (preference saved)
    await expect(page.getByText('We use cookies for analytics')).not.toBeVisible()

    // Verify GA is still NOT loaded
    const gtagScriptAfterReload = await page.evaluate(() => {
      return document.querySelector('script[src*="googletagmanager.com/gtag/js"]')
    })
    expect(gtagScriptAfterReload).toBeNull()
  })

  test('banner displays correctly in both languages', async ({ page }) => {
    await page.goto('/')

    // Verify English text
    await expect(page.getByText('We use cookies for analytics')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Accept All' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reject All' })).toBeVisible()

    // Change language to Spanish via cookie
    await page.evaluate(() => {
      document.cookie = 'lang=es; path=/'
    })
    await page.reload()
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Verify Spanish text
    await expect(page.getByText('Usamos cookies para analítica')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Aceptar todo' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Rechazar todo' })).toBeVisible()
  })

  test('banner is usable on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')

    // Verify banner is visible
    await expect(page.getByText('We use cookies for analytics')).toBeVisible()

    // Verify buttons are visible and clickable
    const acceptButton = page.getByRole('button', { name: 'Accept All' })
    const rejectButton = page.getByRole('button', { name: 'Reject All' })

    await expect(acceptButton).toBeVisible()
    await expect(rejectButton).toBeVisible()

    // Click accept to verify it works on mobile
    await acceptButton.click()
    await expect(page.getByText('We use cookies for analytics')).not.toBeVisible()

    // Verify consent was stored
    const storedConsent = await page.evaluate(() => localStorage.getItem('biolinq_analytics_consent'))
    expect(storedConsent).toBe('accepted')
  })
})
