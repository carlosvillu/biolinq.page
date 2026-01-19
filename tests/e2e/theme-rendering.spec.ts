import { test, expect, seedUser, seedBiolink, seedLink } from '../fixtures'
import { resetDatabase } from '../helpers/db'

test.describe('Theme Rendering', () => {
  test.beforeEach(async ({ dbContext }) => {
    await resetDatabase(dbContext)
  })

  test('renders with default theme (brutalist)', async ({ page, dbContext }) => {
    const userId = await seedUser(dbContext, 'alice')
    await seedBiolink(dbContext, {
      userId,
      username: 'defaultuser',
    })

    await page.goto('/defaultuser')

    const main = page.locator('main')
    await expect(main).toBeVisible()

    const bgColor = await main.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bgColor).toBe('rgb(255, 253, 248)')
  })

  test('renders with light_minimal theme', async ({ page, dbContext }) => {
    const userId = await seedUser(dbContext, 'alice')
    await seedBiolink(dbContext, {
      userId,
      username: 'lightuser',
      theme: 'light_minimal',
    })

    await page.goto('/lightuser')

    const main = page.locator('main')
    await expect(main).toBeVisible()

    const bgColor = await main.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bgColor).toBe('rgb(250, 250, 250)')
  })

  test('renders with brutalist theme', async ({ page, dbContext }) => {
    const userId = await seedUser(dbContext, 'alice')
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'brutaluser',
      theme: 'brutalist',
    })
    await seedLink(dbContext, {
      biolinkId,
      title: 'Test Link',
      url: 'https://example.com',
      position: 0,
    })

    await page.goto('/brutaluser')

    const main = page.locator('main')
    await expect(main).toBeVisible()

    const bgColor = await main.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bgColor).toBe('rgb(255, 253, 248)')

    const linkCard = page.getByRole('link', { name: /Test Link/i })
    await expect(linkCard).toBeVisible()
  })

  test('renders with dark_mode theme', async ({ page, dbContext }) => {
    const userId = await seedUser(dbContext, 'alice')
    await seedBiolink(dbContext, {
      userId,
      username: 'darkuser',
      theme: 'dark_mode',
    })

    await page.goto('/darkuser')

    const main = page.locator('main')
    await expect(main).toBeVisible()

    const bgColor = await main.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bgColor).toBe('rgb(15, 15, 15)')

    const textColor = await main.evaluate((el) => getComputedStyle(el).color)
    expect(textColor).toBe('rgb(249, 250, 251)')
  })

  test('renders with colorful theme', async ({ page, dbContext }) => {
    const userId = await seedUser(dbContext, 'alice')
    await seedBiolink(dbContext, {
      userId,
      username: 'colorfuluser',
      theme: 'colorful',
    })

    await page.goto('/colorfuluser')

    const main = page.locator('main')
    await expect(main).toBeVisible()

    const bgColor = await main.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bgColor).toBe('rgb(253, 244, 255)')
  })

  test('custom colors override theme defaults', async ({ page, dbContext }) => {
    const userId = await seedUser(dbContext, 'alice')
    await seedBiolink(dbContext, {
      userId,
      username: 'customuser',
      theme: 'brutalist',
      customBgColor: '#00FF00',
    })

    await page.goto('/customuser')

    const main = page.locator('main')
    await expect(main).toBeVisible()

    const bgColor = await main.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bgColor).toBe('rgb(0, 255, 0)')
  })

  test('watermark adapts to dark theme', async ({ page, dbContext }) => {
    const userId = await seedUser(dbContext, 'alice', { isPremium: false })
    await seedBiolink(dbContext, {
      userId,
      username: 'darkfree',
      theme: 'dark_mode',
    })

    await page.goto('/darkfree')

    const watermark = page.getByRole('link', { name: /Powered by.*BioLinq/i })
    await expect(watermark).toBeVisible()
  })

})
