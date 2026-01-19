import { test, expect, seedUser, seedBiolink, seedLink } from '../fixtures'
import { resetDatabase } from '../helpers/db'

test.describe('Public Page', () => {
  test.beforeEach(async ({ dbContext }) => {
    await resetDatabase(dbContext)
  })

  test('renders correctly with user data and links', async ({ page, dbContext }) => {
    const userId = await seedUser(dbContext, 'alice', { name: 'Alice User' })
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'testuser',
    })
    await seedLink(dbContext, {
      biolinkId,
      title: 'My Website',
      url: 'https://example.com',
      emoji: '🌐',
      position: 0,
    })
    await seedLink(dbContext, {
      biolinkId,
      title: 'My Blog',
      url: 'https://blog.example.com',
      emoji: '📝',
      position: 1,
    })

    await page.goto('/testuser')

    await expect(page.getByRole('heading', { name: 'Alice User' })).toBeVisible()
    await expect(page.getByText('@testuser')).toBeVisible()
    await expect(page.getByRole('link', { name: /My Website/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /My Blog/i })).toBeVisible()

    const websiteLink = page.getByRole('link', { name: /My Website/i })
    await expect(websiteLink).toHaveAttribute('href', 'https://example.com')
    await expect(websiteLink).toHaveAttribute('target', '_blank')
  })

  test('shows 404 for non-existent username', async ({ page }) => {
    await page.goto('/nonexistent123')

    await expect(page.getByText('404')).toBeVisible()
    await expect(page.getByText('Profile not found')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Create your BioLink' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Create your BioLink' })).toHaveAttribute(
      'href',
      '/'
    )
  })

  test('shows watermark for free users', async ({ page, dbContext }) => {
    const userId = await seedUser(dbContext, 'alice', { isPremium: false })
    await seedBiolink(dbContext, {
      userId,
      username: 'freeuser',
    })

    await page.goto('/freeuser')

    const watermark = page.getByRole('link', { name: /Powered by.*BioLinq/i })
    await expect(watermark).toBeVisible()
    await expect(watermark).toHaveAttribute('href', 'https://biolinq.page')
  })

  test('hides watermark for premium users', async ({ page, dbContext }) => {
    const userId = await seedUser(dbContext, 'bob', { isPremium: true })
    await seedBiolink(dbContext, {
      userId,
      username: 'premiumuser',
    })

    await page.goto('/premiumuser')

    await expect(page.getByRole('heading', { name: 'Bob User' })).toBeVisible()
    const watermark = page.getByRole('link', { name: /Powered by.*BioLinq/i })
    await expect(watermark).not.toBeVisible()
  })

  test('shows empty state when no links', async ({ page, dbContext }) => {
    const userId = await seedUser(dbContext, 'alice')
    await seedBiolink(dbContext, {
      userId,
      username: 'emptyuser',
    })

    await page.goto('/emptyuser')

    await expect(page.getByRole('heading', { name: 'Alice User' })).toBeVisible()
    await expect(page.getByText('No links yet')).toBeVisible()
  })

  test('has correct SEO meta tags', async ({ page, dbContext }) => {
    const userId = await seedUser(dbContext, 'alice', {
      name: 'John Doe',
      image: 'https://example.com/avatar.jpg',
    })
    await seedBiolink(dbContext, {
      userId,
      username: 'seouser',
    })

    await page.goto('/seouser')

    await expect(page).toHaveTitle('John Doe | BioLinq')

    const ogTitle = page.locator('meta[property="og:title"]')
    await expect(ogTitle).toHaveAttribute('content', 'John Doe')

    const ogImage = page.locator('meta[property="og:image"]')
    await expect(ogImage).toHaveAttribute('content', 'https://example.com/avatar.jpg')

    const twitterCard = page.locator('meta[name="twitter:card"]')
    await expect(twitterCard).toHaveAttribute('content', 'summary')

    const canonical = page.locator('link[rel="canonical"]')
    await expect(canonical).toHaveAttribute('href', 'https://biolinq.page/seouser')
  })

  test('uses username as fallback when no display name', async ({ page, dbContext }) => {
    const userId = await seedUser(dbContext, 'alice', { name: '' })
    await seedBiolink(dbContext, {
      userId,
      username: 'noname',
    })

    await page.goto('/noname')

    await expect(page.getByRole('heading', { name: 'noname' })).toBeVisible()
    await expect(page.getByText('@noname')).toBeVisible()
  })
})
