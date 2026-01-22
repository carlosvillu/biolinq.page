import { test, expect, seedUser, seedBiolink, seedLink } from '../fixtures'
import { resetDatabase } from '../helpers/db'

test.describe('Load Time Indicator', () => {
  test.beforeEach(async ({ dbContext }) => {
    await resetDatabase(dbContext)
  })

  test('appears on public profile page with valid load time', async ({ page, dbContext }) => {
    const userId = await seedUser(dbContext, 'alice', { name: 'Alice User' })
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'loadtimeuser',
    })
    await seedLink(dbContext, {
      biolinkId,
      title: 'My Website',
      url: 'https://example.com',
      emoji: '🌐',
      position: 0,
    })

    await page.goto('/loadtimeuser')

    await expect(page.getByRole('heading', { name: 'Alice User' })).toBeVisible()

    const loadTimeIndicator = page.getByText(/This page loaded in \d+ms/)
    await expect(loadTimeIndicator).toBeVisible({ timeout: 5000 })

    const text = await loadTimeIndicator.textContent()
    const match = text?.match(/(\d+)ms/)
    expect(match).toBeTruthy()
    const loadTime = parseInt(match![1], 10)
    expect(loadTime).toBeGreaterThan(0)
  })

  test('is visible for free users', async ({ page, dbContext }) => {
    const userId = await seedUser(dbContext, 'alice', { isPremium: false })
    await seedBiolink(dbContext, {
      userId,
      username: 'freeloadtime',
    })

    await page.goto('/freeloadtime')

    const loadTimeIndicator = page.getByText(/This page loaded in \d+ms/)
    await expect(loadTimeIndicator).toBeVisible({ timeout: 5000 })
  })

  test('is visible for premium users', async ({ page, dbContext }) => {
    const userId = await seedUser(dbContext, 'bob', { isPremium: true })
    await seedBiolink(dbContext, {
      userId,
      username: 'premiumloadtime',
    })

    await page.goto('/premiumloadtime')

    const loadTimeIndicator = page.getByText(/This page loaded in \d+ms/)
    await expect(loadTimeIndicator).toBeVisible({ timeout: 5000 })
  })
})
