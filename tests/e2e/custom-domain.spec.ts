import { test, expect } from '../fixtures/app.fixture'
import { createAuthSession, setAuthCookie } from '../helpers/auth'
import { seedBiolink } from '../fixtures/seeders'
import { executeSQL, type DbContext } from '../helpers/db'

async function makePremium(ctx: DbContext, userId: string): Promise<void> {
  await executeSQL(ctx, `UPDATE users SET is_premium = true WHERE id = $1`, [userId])
}

async function updateBiolinkDomain(
  ctx: DbContext,
  biolinkId: string,
  data: {
    customDomain: string
    domainVerificationToken: string
    domainOwnershipVerified: boolean
    cnameVerified: boolean
  }
): Promise<void> {
  await executeSQL(
    ctx,
    `UPDATE biolinks SET custom_domain = $1, domain_verification_token = $2, domain_ownership_verified = $3, cname_verified = $4 WHERE id = $5`,
    [data.customDomain, data.domainVerificationToken, data.domainOwnershipVerified, data.cnameVerified, biolinkId]
  )
}

test.describe('Custom Domain Feature', () => {
  test.describe('Premium user can manage custom domains', () => {
    test('premium user sees custom domain section in dashboard', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      const { token, userId } = await createAuthSession(baseURL!, {
        email: 'premium-domain-1@example.com',
        password: 'TestPassword123!',
      })

      await makePremium(dbContext, userId)
      await seedBiolink(dbContext, { userId, username: 'premiumtest' })
      await setAuthCookie(context, token)

      await page.goto('/dashboard')

      await expect(page.getByText('Custom Domain')).toBeVisible()
      await expect(page.getByText('Use your own domain')).toBeVisible()
    })

    test('premium user can enter a custom domain', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      const { token, userId } = await createAuthSession(baseURL!, {
        email: 'premium-domain-2@example.com',
        password: 'TestPassword123!',
      })

      await makePremium(dbContext, userId)
      await seedBiolink(dbContext, { userId, username: 'domaintest' })
      await setAuthCookie(context, token)

      await page.goto('/dashboard')

      const domainInput = page.locator('input[name="domain"]')
      await expect(domainInput).toBeVisible()

      await domainInput.fill('links.example.com')
      await page.getByRole('button', { name: 'Add Domain' }).click()

      await expect(page.getByText('Step 1: Verify Domain Ownership')).toBeVisible()
      await expect(page.getByText('_biolinq-verify.links.example.com')).toBeVisible()
    })

    test('shows pending ownership verification badge after adding domain', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      const { token, userId } = await createAuthSession(baseURL!, {
        email: 'premium-domain-3@example.com',
        password: 'TestPassword123!',
      })

      await makePremium(dbContext, userId)
      const biolinkId = await seedBiolink(dbContext, { userId, username: 'pendingtest' })
      await updateBiolinkDomain(dbContext, biolinkId, {
        customDomain: 'pending.example.com',
        domainVerificationToken: 'test-token-123',
        domainOwnershipVerified: false,
        cnameVerified: false,
      })
      await setAuthCookie(context, token)

      await page.goto('/dashboard')

      await expect(page.getByText('pending.example.com', { exact: true })).toBeVisible()
      await expect(page.getByText('Pending ownership verification')).toBeVisible()
    })

    test('shows CNAME pending badge after ownership verified', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      const { token, userId } = await createAuthSession(baseURL!, {
        email: 'premium-domain-4@example.com',
        password: 'TestPassword123!',
      })

      await makePremium(dbContext, userId)
      const biolinkId = await seedBiolink(dbContext, { userId, username: 'cnametest' })
      await updateBiolinkDomain(dbContext, biolinkId, {
        customDomain: 'cname.example.com',
        domainVerificationToken: 'test-token-456',
        domainOwnershipVerified: true,
        cnameVerified: false,
      })
      await setAuthCookie(context, token)

      await page.goto('/dashboard')

      await expect(page.getByText('cname.example.com', { exact: true })).toBeVisible()
      await expect(page.getByText('Pending CNAME configuration')).toBeVisible()
      await expect(page.getByText('Step 2: Configure CNAME')).toBeVisible()
    })

    test('shows live badge when fully verified', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      const { token, userId } = await createAuthSession(baseURL!, {
        email: 'premium-domain-5@example.com',
        password: 'TestPassword123!',
      })

      await makePremium(dbContext, userId)
      const biolinkId = await seedBiolink(dbContext, { userId, username: 'livetest' })
      await updateBiolinkDomain(dbContext, biolinkId, {
        customDomain: 'live.example.com',
        domainVerificationToken: 'test-token-789',
        domainOwnershipVerified: true,
        cnameVerified: true,
      })
      await setAuthCookie(context, token)

      await page.goto('/dashboard')

      await expect(page.getByText('live.example.com', { exact: true })).toBeVisible()
      await expect(page.getByText('Live', { exact: true })).toBeVisible()
      await expect(page.getByText('Domain is Live!')).toBeVisible()
    })
  })

  test.describe('Free user restrictions', () => {
    test('free user sees locked custom domain section with PREMIUM badge', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      const { token, userId } = await createAuthSession(baseURL!, {
        email: 'free-domain@example.com',
        password: 'TestPassword123!',
      })

      await seedBiolink(dbContext, { userId, username: 'freeuser' })
      await setAuthCookie(context, token)

      await page.goto('/dashboard')

      await expect(page.getByText('Custom Domain')).toBeVisible()

      // The section shows PREMIUM badge overlay
      const customDomainSection = page.locator('text=Custom Domain').locator('..')
      await expect(customDomainSection.getByText('PREMIUM')).toBeVisible()

      // The Add Domain button should be disabled
      await expect(page.getByRole('button', { name: 'Add Domain' })).toBeDisabled()
    })
  })

  test.describe('Domain validation', () => {
    test('rejects invalid domain format', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      const { token, userId } = await createAuthSession(baseURL!, {
        email: 'premium-domain-6@example.com',
        password: 'TestPassword123!',
      })

      await makePremium(dbContext, userId)
      await seedBiolink(dbContext, { userId, username: 'invalidtest' })
      await setAuthCookie(context, token)

      await page.goto('/dashboard')

      const domainInput = page.locator('input[name="domain"]')
      await domainInput.fill('not a valid domain')

      // Wait for button to be enabled (React state update)
      const button = page.getByRole('button', { name: 'Add Domain' })
      await expect(button).toBeEnabled({ timeout: 5000 })
      await button.click()

      await expect(page.getByText('Invalid domain format')).toBeVisible()
    })

    test('rejects biolinq.page domain', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      const { token, userId } = await createAuthSession(baseURL!, {
        email: 'premium-domain-7@example.com',
        password: 'TestPassword123!',
      })

      await makePremium(dbContext, userId)
      await seedBiolink(dbContext, { userId, username: 'blockedtest' })
      await setAuthCookie(context, token)

      await page.goto('/dashboard')

      const domainInput = page.locator('input[name="domain"]')
      await domainInput.fill('test.biolinq.page')

      // Wait for button to be enabled (React state update)
      const button = page.getByRole('button', { name: 'Add Domain' })
      await expect(button).toBeEnabled({ timeout: 5000 })
      await button.click()

      await expect(page.getByText('Invalid domain format')).toBeVisible()
    })
  })

  test.describe('Remove domain', () => {
    test('user can remove custom domain', async ({
      page,
      context,
      baseURL,
      dbContext,
    }) => {
      const { token, userId } = await createAuthSession(baseURL!, {
        email: 'premium-domain-8@example.com',
        password: 'TestPassword123!',
      })

      await makePremium(dbContext, userId)
      const biolinkId = await seedBiolink(dbContext, { userId, username: 'removetest' })
      await updateBiolinkDomain(dbContext, biolinkId, {
        customDomain: 'remove.example.com',
        domainVerificationToken: 'test-token-remove',
        domainOwnershipVerified: false,
        cnameVerified: false,
      })
      await setAuthCookie(context, token)

      await page.goto('/dashboard')

      await expect(page.getByText('remove.example.com', { exact: true })).toBeVisible()

      await page.getByText('Remove Domain').click()

      await page.waitForURL('/dashboard')

      const domainInput = page.locator('input[name="domain"]')
      await expect(domainInput).toBeVisible()
    })
  })
})
