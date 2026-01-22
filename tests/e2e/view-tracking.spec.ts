import { test, expect, seedUser, seedBiolink, seedLink } from '../fixtures'
import { resetDatabase, executeSQL } from '../helpers/db'

test.describe('View Tracking', () => {
  test.beforeEach(async ({ dbContext }) => {
    await resetDatabase(dbContext)
  })

  test('view increments totalViews', async ({
    page,
    appServer,
    dbContext,
  }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const userId = await seedUser(dbContext, 'alice')
    await seedBiolink(dbContext, {
      userId,
      username: 'viewtest',
    })

    await page.goto(`${baseUrl}/viewtest`)
    await page.waitForTimeout(500)

    const result = await executeSQL(
      dbContext,
      'SELECT total_views FROM biolinks WHERE user_id = $1',
      [userId]
    )
    expect(result.rows[0].total_views).toBe(1)
  })

  test('view creates record in daily_stats', async ({
    page,
    appServer,
    dbContext,
  }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const userId = await seedUser(dbContext, 'alice')
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'dailyviewtest',
    })

    await page.goto(`${baseUrl}/dailyviewtest`)
    await page.waitForTimeout(500)

    const result = await executeSQL(
      dbContext,
      'SELECT views, clicks FROM daily_stats WHERE biolink_id = $1',
      [biolinkId]
    )
    expect(result.rows.length).toBe(1)
    expect(result.rows[0].views).toBe(1)
    expect(result.rows[0].clicks).toBe(0)
  })

  test('sessionStorage prevents duplicate view in same session', async ({
    page,
    appServer,
    dbContext,
  }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const userId = await seedUser(dbContext, 'alice')
    await seedBiolink(dbContext, {
      userId,
      username: 'cookietest',
    })

    await page.goto(`${baseUrl}/cookietest`)
    await page.waitForTimeout(500)

    await page.goto(`${baseUrl}/cookietest`)
    await page.waitForTimeout(500)

    const result = await executeSQL(
      dbContext,
      'SELECT total_views FROM biolinks WHERE user_id = $1',
      [userId]
    )
    expect(result.rows[0].total_views).toBe(1)
  })

  test('different biolinks track separately', async ({
    page,
    appServer,
    dbContext,
  }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const userId1 = await seedUser(dbContext, 'alice')
    await seedBiolink(dbContext, {
      userId: userId1,
      username: 'aliceprofile',
    })

    const userId2 = await seedUser(dbContext, 'bob')
    await seedBiolink(dbContext, {
      userId: userId2,
      username: 'bobprofile',
    })

    await page.goto(`${baseUrl}/aliceprofile`)
    await page.waitForTimeout(500)

    await page.goto(`${baseUrl}/bobprofile`)
    await page.waitForTimeout(500)

    const aliceResult = await executeSQL(
      dbContext,
      'SELECT total_views FROM biolinks WHERE user_id = $1',
      [userId1]
    )
    expect(aliceResult.rows[0].total_views).toBe(1)

    const bobResult = await executeSQL(
      dbContext,
      'SELECT total_views FROM biolinks WHERE user_id = $1',
      [userId2]
    )
    expect(bobResult.rows[0].total_views).toBe(1)
  })

  test('click tracking updates daily_stats.clicks', async ({
    request,
    appServer,
    dbContext,
  }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const userId = await seedUser(dbContext, 'alice')
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'clickstatstest',
    })
    const linkId = await seedLink(dbContext, {
      biolinkId,
      title: 'Test Link',
      url: 'https://example.com',
      position: 0,
    })

    await request.get(`${baseUrl}/go/${linkId}`, { maxRedirects: 0 })

    const result = await executeSQL(
      dbContext,
      'SELECT clicks FROM daily_stats WHERE biolink_id = $1',
      [biolinkId]
    )
    expect(result.rows.length).toBe(1)
    expect(result.rows[0].clicks).toBe(1)
  })

  test('view and click on same day accumulate correctly', async ({
    page,
    request,
    appServer,
    dbContext,
  }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const userId = await seedUser(dbContext, 'alice')
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'accumtest',
    })
    const linkId = await seedLink(dbContext, {
      biolinkId,
      title: 'Accum Link',
      url: 'https://accum.example.com',
      position: 0,
    })

    await page.goto(`${baseUrl}/accumtest`)
    await page.waitForTimeout(500)

    await request.get(`${baseUrl}/go/${linkId}`, { maxRedirects: 0 })

    const result = await executeSQL(
      dbContext,
      'SELECT views, clicks FROM daily_stats WHERE biolink_id = $1',
      [biolinkId]
    )
    expect(result.rows.length).toBe(1)
    expect(result.rows[0].views).toBe(1)
    expect(result.rows[0].clicks).toBe(1)
  })
})
