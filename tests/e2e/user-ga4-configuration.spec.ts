import { test, expect } from '../fixtures/app.fixture'
import { createAuthSession, setAuthCookie } from '../helpers/auth'
import { seedBiolink } from '../fixtures/seeders'
import { executeSQL, type DbContext } from '../helpers/db'

async function makePremium(ctx: DbContext, userId: string): Promise<void> {
  await executeSQL(ctx, `UPDATE users SET is_premium = true WHERE id = $1`, [userId])
}

async function setBiolinkGA4(
  ctx: DbContext,
  biolinkId: string,
  ga4MeasurementId: string | null
): Promise<void> {
  await executeSQL(
    ctx,
    `UPDATE biolinks SET ga4_measurement_id = $1 WHERE id = $2`,
    [ga4MeasurementId, biolinkId]
  )
}

test.describe('User GA4 Configuration Feature', () => {
  test.describe('Premium user can manage GA4 settings', () => {
    test('premium user sees GA4 settings section in dashboard', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      const { token, userId } = await createAuthSession(baseURL!, {
        email: 'premium-ga4-1@example.com',
        password: 'TestPassword123!',
      })

      await makePremium(dbContext, userId)
      await seedBiolink(dbContext, { userId, username: 'premiumga4test' })
      await setAuthCookie(context, token)

      await page.goto('/dashboard')

      await expect(page.getByRole('heading', { name: 'Google Analytics' })).toBeVisible()
      await expect(page.getByText('Add your own GA4 Measurement ID')).toBeVisible()
    })

    test('premium user can save a valid GA4 ID', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      const { token, userId } = await createAuthSession(baseURL!, {
        email: 'premium-ga4-2@example.com',
        password: 'TestPassword123!',
      })

      await makePremium(dbContext, userId)
      await seedBiolink(dbContext, { userId, username: 'savega4test' })
      await setAuthCookie(context, token)

      await page.goto('/dashboard')

      const ga4Input = page.locator('input#ga4-measurement-id')
      await expect(ga4Input).toBeVisible()

      await ga4Input.fill('G-ABC123DEF0')
      await page.getByRole('button', { name: 'Save GA4 ID' }).click()

      await page.waitForURL('/dashboard')

      // Should show the current ID
      await expect(page.getByText('Current ID')).toBeVisible()
      await expect(page.getByText('G-ABC123DEF0')).toBeVisible()
    })

    test('premium user can remove GA4 ID by saving empty value', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      const { token, userId } = await createAuthSession(baseURL!, {
        email: 'premium-ga4-3@example.com',
        password: 'TestPassword123!',
      })

      await makePremium(dbContext, userId)
      const biolinkId = await seedBiolink(dbContext, { userId, username: 'removega4test' })
      await setBiolinkGA4(dbContext, biolinkId, 'G-ABC123DEF0')
      await setAuthCookie(context, token)

      await page.goto('/dashboard')

      // Should show current ID
      await expect(page.getByText('Current ID')).toBeVisible()

      const ga4Input = page.locator('input#ga4-measurement-id')
      await ga4Input.fill('')
      await page.getByRole('button', { name: 'Save GA4 ID' }).click()

      await page.waitForURL('/dashboard')

      // Should not show current ID anymore
      await expect(page.getByText('Current ID')).not.toBeVisible()
    })

    test('shows current GA4 ID when configured', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      const { token, userId } = await createAuthSession(baseURL!, {
        email: 'premium-ga4-4@example.com',
        password: 'TestPassword123!',
      })

      await makePremium(dbContext, userId)
      const biolinkId = await seedBiolink(dbContext, { userId, username: 'existingga4test' })
      await setBiolinkGA4(dbContext, biolinkId, 'G-EXISTING12')
      await setAuthCookie(context, token)

      await page.goto('/dashboard')

      await expect(page.getByText('Current ID')).toBeVisible()
      await expect(page.getByText('G-EXISTING12')).toBeVisible()
    })
  })

  test.describe('Free user restrictions', () => {
    test('free user sees locked GA4 section with PREMIUM badge', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      const { token, userId } = await createAuthSession(baseURL!, {
        email: 'free-ga4@example.com',
        password: 'TestPassword123!',
      })

      await seedBiolink(dbContext, { userId, username: 'freega4user' })
      await setAuthCookie(context, token)

      await page.goto('/dashboard')

      await expect(page.getByText('Google Analytics')).toBeVisible()

      // The section shows PREMIUM badge overlay
      const ga4Section = page.locator('text=Google Analytics').locator('..')
      await expect(ga4Section.getByText('PREMIUM')).toBeVisible()

      // The Save button should be disabled
      await expect(page.getByRole('button', { name: 'Save GA4 ID' })).toBeDisabled()
    })
  })

  test.describe('GA4 ID validation', () => {
    test('rejects invalid GA4 ID format', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      const { token, userId } = await createAuthSession(baseURL!, {
        email: 'premium-ga4-5@example.com',
        password: 'TestPassword123!',
      })

      await makePremium(dbContext, userId)
      await seedBiolink(dbContext, { userId, username: 'invalidga4test' })
      await setAuthCookie(context, token)

      await page.goto('/dashboard')

      const ga4Input = page.locator('input#ga4-measurement-id')
      await ga4Input.fill('not-valid-format')

      // Should show validation error
      await expect(page.getByText('Invalid format')).toBeVisible()

      // Save button should be disabled
      await expect(page.getByRole('button', { name: 'Save GA4 ID' })).toBeDisabled()
    })

    test('rejects GA4 ID with wrong length', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      const { token, userId } = await createAuthSession(baseURL!, {
        email: 'premium-ga4-6@example.com',
        password: 'TestPassword123!',
      })

      await makePremium(dbContext, userId)
      await seedBiolink(dbContext, { userId, username: 'wronglengthga4' })
      await setAuthCookie(context, token)

      await page.goto('/dashboard')

      const ga4Input = page.locator('input#ga4-measurement-id')
      await ga4Input.fill('G-ABC123')  // Too short

      // Should show validation error
      await expect(page.getByText('Invalid format')).toBeVisible()
    })

    test('accepts valid GA4 ID format', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      const { token, userId } = await createAuthSession(baseURL!, {
        email: 'premium-ga4-7@example.com',
        password: 'TestPassword123!',
      })

      await makePremium(dbContext, userId)
      await seedBiolink(dbContext, { userId, username: 'validga4test' })
      await setAuthCookie(context, token)

      await page.goto('/dashboard')

      const ga4Input = page.locator('input#ga4-measurement-id')
      await ga4Input.fill('G-ABC123DEF0')

      // Should not show validation error
      await expect(page.getByText('Invalid format')).not.toBeVisible()

      // Save button should be enabled
      await expect(page.getByRole('button', { name: 'Save GA4 ID' })).toBeEnabled()
    })
  })

  test.describe('Public page GA4 integration', () => {
    test('public page includes user GA4 config for premium users with configured ID', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      const { token, userId } = await createAuthSession(baseURL!, {
        email: 'premium-ga4-8@example.com',
        password: 'TestPassword123!',
      })

      await makePremium(dbContext, userId)
      const biolinkId = await seedBiolink(dbContext, { userId, username: 'publicga4test' })
      await setBiolinkGA4(dbContext, biolinkId, 'G-PUBLIC1234')
      await setAuthCookie(context, token)

      await page.goto('/publicga4test')

      // Accept cookie consent to enable GA4
      await page.getByRole('button', { name: 'Accept All' }).click()

      // Wait for GA4 to be initialized
      await page.waitForTimeout(500)

      // Check for gtag config with user GA4 ID in page source
      const pageContent = await page.content()
      expect(pageContent).toContain('G-PUBLIC1234')

      // Check that the GA4 script is loaded
      const scripts = await page.locator('script[src*="googletagmanager.com"]').all()
      expect(scripts.length).toBeGreaterThan(0)
    })

    test('public page does not include user GA4 config when not configured', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      const { token, userId } = await createAuthSession(baseURL!, {
        email: 'premium-ga4-9@example.com',
        password: 'TestPassword123!',
      })

      await makePremium(dbContext, userId)
      await seedBiolink(dbContext, { userId, username: 'noga4test' })
      // Don't set GA4 ID
      await setAuthCookie(context, token)

      await page.goto('/noga4test')

      // Accept cookie consent to enable GA4
      await page.getByRole('button', { name: 'Accept All' }).click()

      // Wait for GA4 to be initialized
      await page.waitForTimeout(500)

      // Check that gtag config does not contain a user GA4 ID pattern
      const pageContent = await page.content()
      // Should not have a user GA4 config (G- followed by 10 chars after config)
      // Only site GA4 should be present (G-TESTMEASURE from test env)
      expect(pageContent).not.toContain('G-PUBLIC1234')
    })
  })
})
