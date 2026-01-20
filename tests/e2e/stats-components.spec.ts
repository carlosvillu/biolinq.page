import { test, expect } from '../fixtures/app.fixture'
import { seedBiolink, seedLink, seedDailyStat } from '../fixtures/seeders'
import { resetDatabase, executeSQL } from '../helpers/db'
import { createAuthSession, setAuthCookie } from '../helpers/auth'

test.describe('Stats Components', () => {
  test.beforeEach(async ({ dbContext }) => {
    await resetDatabase(dbContext)
  })

  test.describe('Free user', () => {
    test('sees total views but premium sections are locked', async ({
      page,
      context,
      appServer,
    }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const { token } = await createAuthSession(baseUrl, {
        email: 'freeuser-stats@example.com',
        password: 'password123',
        name: 'Free Stats User',
      })
      await setAuthCookie(context, token)

      await page.goto(`${baseUrl}/`)
      await page.getByPlaceholder('username').fill('freeuser')
      await page.getByRole('button', { name: /create my biolink/i }).click()
      await page.waitForURL('**/dashboard')

      await expect(page.getByText('Total Views').first()).toBeVisible()
      await expect(page.getByText('0').first()).toBeVisible()

      const premiumBadges = page.locator('text=PREMIUM')
      await expect(premiumBadges.first()).toBeVisible()
      expect(await premiumBadges.count()).toBeGreaterThanOrEqual(3)

      await expect(page.getByText('Daily Activity (7 days)')).toBeVisible()
      await expect(page.getByText('Link Performance')).toBeVisible()
    })
  })

  test.describe('Premium user', () => {
    test('sees full analytics without locks', async ({
      page,
      context,
      appServer,
      dbContext,
    }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const { token, userId } = await createAuthSession(baseUrl, {
        email: 'premium-full@example.com',
        password: 'password123',
        name: 'Premium Full User',
      })

      await executeSQL(dbContext, 'UPDATE users SET is_premium = true WHERE id = $1', [userId])

      const biolinkId = await seedBiolink(dbContext, {
        userId,
        username: 'premiumstats',
        totalViews: 150,
      })

      await seedLink(dbContext, {
        biolinkId,
        title: 'My Website',
        emoji: '🌐',
        url: 'https://example.com',
        position: 0,
        totalClicks: 25,
      })
      await seedLink(dbContext, {
        biolinkId,
        title: 'Twitter',
        emoji: '🐦',
        url: 'https://twitter.com/test',
        position: 1,
        totalClicks: 50,
      })
      await seedLink(dbContext, {
        biolinkId,
        title: 'GitHub',
        emoji: '💻',
        url: 'https://github.com/test',
        position: 2,
        totalClicks: 30,
      })

      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setUTCDate(date.getUTCDate() - i)
        await seedDailyStat(dbContext, {
          biolinkId,
          date,
          views: 10 + i * 5,
          clicks: 5 + i * 2,
        })
      }

      await setAuthCookie(context, token)

      await page.goto(`${baseUrl}/dashboard`)
      await page.waitForURL('**/dashboard')

      await expect(page.getByText('Total Views')).toBeVisible()
      await expect(page.getByText('150')).toBeVisible()

      await expect(page.getByText('Total Clicks')).toBeVisible()
      await expect(page.getByText('105')).toBeVisible()

      const premiumBadges = page.locator('text=PREMIUM')
      await expect(premiumBadges).toHaveCount(0)

      await expect(page.getByText('Daily Activity (7 days)')).toBeVisible()

      await expect(page.getByText('Link Performance')).toBeVisible()
      await expect(page.getByText('25 clicks')).toBeVisible()
      await expect(page.getByText('50 clicks')).toBeVisible()
      await expect(page.getByText('30 clicks')).toBeVisible()
    })

    test('DailyChart renders 7 days correctly', async ({
      page,
      context,
      appServer,
      dbContext,
    }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const { token, userId } = await createAuthSession(baseUrl, {
        email: 'premium-chart@example.com',
        password: 'password123',
        name: 'Premium Chart User',
      })

      await executeSQL(dbContext, 'UPDATE users SET is_premium = true WHERE id = $1', [userId])

      const biolinkId = await seedBiolink(dbContext, {
        userId,
        username: 'charttest',
      })

      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setUTCDate(date.getUTCDate() - i)
        await seedDailyStat(dbContext, {
          biolinkId,
          date,
          views: 10,
          clicks: 5,
        })
      }

      await setAuthCookie(context, token)

      await page.goto(`${baseUrl}/dashboard`)

      await expect(page.getByText('Daily Activity (7 days)')).toBeVisible()

      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      let foundDays = 0
      for (const day of dayLabels) {
        const dayElement = page.locator(`text=${day}`).first()
        if (await dayElement.isVisible().catch(() => false)) {
          foundDays++
        }
      }
      expect(foundDays).toBeGreaterThanOrEqual(7)
    })

    test('LinkPerformance shows all user links', async ({
      page,
      context,
      appServer,
      dbContext,
    }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const { token, userId } = await createAuthSession(baseUrl, {
        email: 'premium-links@example.com',
        password: 'password123',
        name: 'Premium Links User',
      })

      await executeSQL(dbContext, 'UPDATE users SET is_premium = true WHERE id = $1', [userId])

      const biolinkId = await seedBiolink(dbContext, {
        userId,
        username: 'linkstest',
      })

      await seedLink(dbContext, {
        biolinkId,
        title: 'First Link',
        emoji: '1️⃣',
        url: 'https://first.com',
        position: 0,
        totalClicks: 100,
      })
      await seedLink(dbContext, {
        biolinkId,
        title: 'Second Link',
        emoji: '2️⃣',
        url: 'https://second.com',
        position: 1,
        totalClicks: 50,
      })
      await seedLink(dbContext, {
        biolinkId,
        title: 'Third Link',
        emoji: '3️⃣',
        url: 'https://third.com',
        position: 2,
        totalClicks: 25,
      })

      await setAuthCookie(context, token)

      await page.goto(`${baseUrl}/dashboard`)

      await expect(page.getByText('Link Performance')).toBeVisible()
      await expect(page.getByText('100 clicks')).toBeVisible()
      await expect(page.getByText('50 clicks')).toBeVisible()
      await expect(page.getByText('25 clicks')).toBeVisible()
    })
  })

  test.describe('Stats section order', () => {
    test('stats section appears above links editor', async ({
      page,
      context,
      appServer,
    }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const { token } = await createAuthSession(baseUrl, {
        email: 'order-test@example.com',
        password: 'password123',
        name: 'Order Test User',
      })
      await setAuthCookie(context, token)

      await page.goto(`${baseUrl}/`)
      await page.getByPlaceholder('username').fill('ordertest')
      await page.getByRole('button', { name: /create my biolink/i }).click()
      await page.waitForURL('**/dashboard')

      const statsOverview = page.getByText('Total Views').first()
      const dailyChart = page.getByText('Daily Activity (7 days)').first()
      const linkPerformance = page.getByText('Link Performance').first()
      const myLinks = page.getByText('My Links').first()

      await expect(statsOverview).toBeVisible()
      await expect(dailyChart).toBeVisible()
      await expect(linkPerformance).toBeVisible()
      await expect(myLinks).toBeVisible()

      const statsBox = await statsOverview.boundingBox()
      const chartBox = await dailyChart.boundingBox()
      const perfBox = await linkPerformance.boundingBox()
      const linksBox = await myLinks.boundingBox()

      expect(statsBox!.y).toBeLessThan(chartBox!.y)
      expect(chartBox!.y).toBeLessThan(perfBox!.y)
      expect(perfBox!.y).toBeLessThan(linksBox!.y)
    })
  })
})
