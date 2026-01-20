import { test, expect } from '../fixtures/app.fixture'
import { seedUser, seedBiolink, seedLink, seedDailyStat } from '../fixtures/seeders'
import { resetDatabase } from '../helpers/db'

test.describe('Analytics Service', () => {
  test.beforeEach(async ({ dbContext }) => {
    await resetDatabase(dbContext)
  })

  test.describe('getBasicStats', () => {
    test('returns totalViews for owner', async ({ request, appServer, dbContext }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const userId = await seedUser(dbContext, 'statsUser')
      const biolinkId = await seedBiolink(dbContext, {
        userId,
        username: 'statsuser',
        totalViews: 42,
      })

      const response = await request.get(
        `${baseUrl}/api/__test__/analytics?type=basic&biolinkId=${biolinkId}&userId=${userId}`
      )

      expect(response.ok()).toBe(true)
      const data = await response.json()
      expect(data).toEqual({ totalViews: 42 })
    })

    test('returns 404 for non-existent biolink', async ({ request, appServer, dbContext }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const userId = await seedUser(dbContext, 'statsUser')
      const randomBiolinkId = '00000000-0000-0000-0000-000000000000'

      const response = await request.get(
        `${baseUrl}/api/__test__/analytics?type=basic&biolinkId=${randomBiolinkId}&userId=${userId}`
      )

      expect(response.status()).toBe(404)
      const data = await response.json()
      expect(data).toEqual({ error: 'Biolink not found' })
    })

    test('returns 403 for non-owner', async ({ request, appServer, dbContext }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const userAId = await seedUser(dbContext, 'alice')
      const userBId = await seedUser(dbContext, 'bob')
      const biolinkId = await seedBiolink(dbContext, {
        userId: userAId,
        username: 'aliceuser',
        totalViews: 100,
      })

      const response = await request.get(
        `${baseUrl}/api/__test__/analytics?type=basic&biolinkId=${biolinkId}&userId=${userBId}`
      )

      expect(response.status()).toBe(403)
      const data = await response.json()
      expect(data).toEqual({ error: "Not authorized to view this biolink's stats" })
    })
  })

  test.describe('getPremiumStats', () => {
    test('returns full stats for premium owner', async ({ request, appServer, dbContext }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const userId = await seedUser(dbContext, 'premiumUser', { isPremium: true })
      const biolinkId = await seedBiolink(dbContext, {
        userId,
        username: 'premiumuser',
        totalViews: 100,
      })

      await seedLink(dbContext, {
        biolinkId,
        title: 'Link 1',
        emoji: '🔗',
        url: 'https://link1.com',
        position: 0,
        totalClicks: 10,
      })
      await seedLink(dbContext, {
        biolinkId,
        title: 'Link 2',
        url: 'https://link2.com',
        position: 1,
        totalClicks: 20,
      })
      await seedLink(dbContext, {
        biolinkId,
        title: 'Link 3',
        emoji: '📧',
        url: 'https://link3.com',
        position: 2,
        totalClicks: 15,
      })

      const response = await request.get(
        `${baseUrl}/api/__test__/analytics?type=premium&biolinkId=${biolinkId}&userId=${userId}`
      )

      expect(response.ok()).toBe(true)
      const data = await response.json()

      expect(data.totalViews).toBe(100)
      expect(data.totalClicks).toBe(45)
      expect(data.linksBreakdown).toHaveLength(3)
      expect(data.linksBreakdown[0].title).toBe('Link 1')
      expect(data.linksBreakdown[0].emoji).toBe('🔗')
      expect(data.linksBreakdown[0].totalClicks).toBe(10)
      expect(data.linksBreakdown[1].title).toBe('Link 2')
      expect(data.linksBreakdown[1].emoji).toBeNull()
      expect(data.linksBreakdown[1].totalClicks).toBe(20)
      expect(data.linksBreakdown[2].title).toBe('Link 3')
      expect(data.linksBreakdown[2].emoji).toBe('📧')
      expect(data.linksBreakdown[2].totalClicks).toBe(15)
    })

    test('returns 403 for free user', async ({ request, appServer, dbContext }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const userId = await seedUser(dbContext, 'statsUser', { isPremium: false })
      const biolinkId = await seedBiolink(dbContext, {
        userId,
        username: 'freeuser',
        totalViews: 50,
      })

      const response = await request.get(
        `${baseUrl}/api/__test__/analytics?type=premium&biolinkId=${biolinkId}&userId=${userId}`
      )

      expect(response.status()).toBe(403)
      const data = await response.json()
      expect(data).toEqual({ error: 'Premium subscription required' })
    })

    test('returns 403 for non-owner', async ({ request, appServer, dbContext }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const userAId = await seedUser(dbContext, 'alice', { isPremium: true })
      const userBId = await seedUser(dbContext, 'bob', { isPremium: true })
      const biolinkId = await seedBiolink(dbContext, {
        userId: userAId,
        username: 'alicepremium',
        totalViews: 100,
      })

      const response = await request.get(
        `${baseUrl}/api/__test__/analytics?type=premium&biolinkId=${biolinkId}&userId=${userBId}`
      )

      expect(response.status()).toBe(403)
      const data = await response.json()
      expect(data).toEqual({ error: "Not authorized to view this biolink's stats" })
    })
  })

  test.describe('getLast30DaysData', () => {
    test('returns daily data for premium owner', async ({ request, appServer, dbContext }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const userId = await seedUser(dbContext, 'premiumUser', { isPremium: true })
      const biolinkId = await seedBiolink(dbContext, {
        userId,
        username: 'chartuser',
      })

      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)

      const yesterday = new Date(today)
      yesterday.setUTCDate(yesterday.getUTCDate() - 1)

      const twoDaysAgo = new Date(today)
      twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2)

      await seedDailyStat(dbContext, {
        biolinkId,
        date: twoDaysAgo,
        views: 10,
        clicks: 5,
      })
      await seedDailyStat(dbContext, {
        biolinkId,
        date: yesterday,
        views: 20,
        clicks: 8,
      })
      await seedDailyStat(dbContext, {
        biolinkId,
        date: today,
        views: 15,
        clicks: 3,
      })

      const response = await request.get(
        `${baseUrl}/api/__test__/analytics?type=chart&biolinkId=${biolinkId}&userId=${userId}`
      )

      expect(response.ok()).toBe(true)
      const data = await response.json()

      expect(data).toHaveLength(3)
      expect(data[0].views).toBe(10)
      expect(data[0].clicks).toBe(5)
      expect(data[1].views).toBe(20)
      expect(data[1].clicks).toBe(8)
      expect(data[2].views).toBe(15)
      expect(data[2].clicks).toBe(3)
    })

    test('returns empty array when no data', async ({ request, appServer, dbContext }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const userId = await seedUser(dbContext, 'premiumUser', { isPremium: true })
      const biolinkId = await seedBiolink(dbContext, {
        userId,
        username: 'nodatauser',
      })

      const response = await request.get(
        `${baseUrl}/api/__test__/analytics?type=chart&biolinkId=${biolinkId}&userId=${userId}`
      )

      expect(response.ok()).toBe(true)
      const data = await response.json()
      expect(data).toEqual([])
    })

    test('returns 403 for free user', async ({ request, appServer, dbContext }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const userId = await seedUser(dbContext, 'statsUser', { isPremium: false })
      const biolinkId = await seedBiolink(dbContext, {
        userId,
        username: 'freechartuser',
      })

      const response = await request.get(
        `${baseUrl}/api/__test__/analytics?type=chart&biolinkId=${biolinkId}&userId=${userId}`
      )

      expect(response.status()).toBe(403)
      const data = await response.json()
      expect(data).toEqual({ error: 'Premium subscription required' })
    })
  })
})
