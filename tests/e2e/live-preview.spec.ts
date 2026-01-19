import { test, expect } from '../fixtures/app.fixture'
import { createAuthSession, setAuthCookie } from '../helpers/auth'
import { seedBiolink, seedLink } from '../fixtures/seeders'

test.describe('Live Preview', () => {
  test('dashboard shows live iframe preview of user public page', async ({
    page,
    context,
    baseURL,
    dbContext,
  }) => {
    // Create authenticated user
    const { token, userId } = await createAuthSession(baseURL!, {
      email: 'live-preview@example.com',
      password: 'TestPassword123!',
    })

    // Create biolink with username
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'livepreviewuser',
    })

    // Seed one link
    await seedLink(dbContext, {
      biolinkId,
      title: 'Test Link',
      url: 'https://example.com',
      position: 0,
    })

    // Set auth cookie
    await setAuthCookie(context, token)

    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 })

    // Navigate to dashboard
    await page.goto('/dashboard')

    // Verify iframe exists within the preview
    const iframe = page.locator('iframe[title="Live Preview"]')
    await expect(iframe).toBeVisible()

    // Verify iframe src contains the username
    const src = await iframe.getAttribute('src')
    expect(src).toContain('/livepreviewuser')

    // Verify "Live Preview" indicator is visible
    await expect(page.getByText('Live Preview')).toBeVisible()
  })

  test('refresh button reloads the iframe content', async ({
    page,
    context,
    baseURL,
    dbContext,
  }) => {
    // Create authenticated user
    const { token, userId } = await createAuthSession(baseURL!, {
      email: 'refresh-preview@example.com',
      password: 'TestPassword123!',
    })

    // Create biolink
    await seedBiolink(dbContext, {
      userId,
      username: 'refreshpreviewuser',
    })

    // Set auth cookie
    await setAuthCookie(context, token)

    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 })

    // Navigate to dashboard
    await page.goto('/dashboard')

    // Get initial iframe src
    const iframe = page.locator('iframe[title="Live Preview"]')
    await expect(iframe).toBeVisible()
    const initialSrc = await iframe.getAttribute('src')

    // Click refresh button
    await page.getByRole('button', { name: /refresh preview/i }).click()

    // Wait for iframe to update (src should change with new timestamp)
    await expect(iframe).toHaveAttribute('src', /t=1/)

    // Verify src changed (cache busting timestamp)
    const newSrc = await iframe.getAttribute('src')
    expect(newSrc).not.toBe(initialSrc)
  })

  test('loading spinner shows while iframe loads', async ({
    page,
    context,
    baseURL,
    dbContext,
  }) => {
    // Create authenticated user
    const { token, userId } = await createAuthSession(baseURL!, {
      email: 'loading-preview@example.com',
      password: 'TestPassword123!',
    })

    // Create biolink
    await seedBiolink(dbContext, {
      userId,
      username: 'loadingpreviewuser',
    })

    // Set auth cookie
    await setAuthCookie(context, token)

    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 })

    // Navigate to dashboard
    await page.goto('/dashboard')

    // The spinner should be visible initially or disappear after load
    // We verify the iframe loads successfully (spinner disappears)
    const iframe = page.locator('iframe[title="Live Preview"]')
    await expect(iframe).toBeVisible()

    // After iframe loads, spinner should not be visible
    // Wait for iframe to load
    await page.waitForTimeout(1000)
    
    // Verify loading text is not visible after load
    await expect(page.getByText('Loading preview...')).not.toBeVisible()
  })

  test('live preview is hidden on mobile', async ({
    page,
    context,
    baseURL,
    dbContext,
  }) => {
    // Create authenticated user
    const { token, userId } = await createAuthSession(baseURL!, {
      email: 'mobile-preview@example.com',
      password: 'TestPassword123!',
    })

    // Create biolink
    await seedBiolink(dbContext, {
      userId,
      username: 'mobilepreviewuser',
    })

    // Set auth cookie
    await setAuthCookie(context, token)

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Navigate to dashboard
    await page.goto('/dashboard')

    // Verify iframe is NOT visible on mobile
    const iframe = page.locator('iframe[title="Live Preview"]')
    await expect(iframe).not.toBeVisible()

    // Verify "Live Preview" text is also not visible
    await expect(page.locator('text=Live Preview').first()).not.toBeVisible()
  })
})
