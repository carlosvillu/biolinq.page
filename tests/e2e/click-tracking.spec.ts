import { test, expect, seedUser, seedBiolink, seedLink } from '../fixtures'
import { resetDatabase, executeSQL } from '../helpers/db'

test.describe('Click Tracking', () => {
  test.beforeEach(async ({ dbContext }) => {
    await resetDatabase(dbContext)
  })

  test('click on link increments totalClicks', async ({
    request,
    appServer,
    dbContext,
  }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const userId = await seedUser(dbContext, 'alice')
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'clicktest',
    })
    const linkId = await seedLink(dbContext, {
      biolinkId,
      title: 'Test Link',
      url: 'https://example.com',
      position: 0,
    })

    const response = await request.get(`${baseUrl}/go/${linkId}`, {
      maxRedirects: 0,
    })

    expect(response.status()).toBe(302)
    expect(response.headers()['location']).toBe('https://example.com')

    const result = await executeSQL(
      dbContext,
      'SELECT total_clicks FROM links WHERE id = $1',
      [linkId]
    )
    expect(result.rows[0].total_clicks).toBe(1)
  })

  test('click creates record in daily_link_clicks', async ({
    request,
    appServer,
    dbContext,
  }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const userId = await seedUser(dbContext, 'alice')
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'dailytest',
    })
    const linkId = await seedLink(dbContext, {
      biolinkId,
      title: 'Daily Test Link',
      url: 'https://daily.example.com',
      position: 0,
    })

    await request.get(`${baseUrl}/go/${linkId}`, { maxRedirects: 0 })

    const result = await executeSQL(
      dbContext,
      'SELECT clicks, date FROM daily_link_clicks WHERE link_id = $1',
      [linkId]
    )
    expect(result.rows.length).toBe(1)
    expect(result.rows[0].clicks).toBe(1)
  })

  test('multiple clicks increment correctly', async ({
    request,
    appServer,
    dbContext,
  }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const userId = await seedUser(dbContext, 'alice')
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'multiclick',
    })
    const linkId = await seedLink(dbContext, {
      biolinkId,
      title: 'Multi Click Link',
      url: 'https://multi.example.com',
      position: 0,
    })

    await request.get(`${baseUrl}/go/${linkId}`, { maxRedirects: 0 })
    await request.get(`${baseUrl}/go/${linkId}`, { maxRedirects: 0 })
    await request.get(`${baseUrl}/go/${linkId}`, { maxRedirects: 0 })

    const linksResult = await executeSQL(
      dbContext,
      'SELECT total_clicks FROM links WHERE id = $1',
      [linkId]
    )
    expect(linksResult.rows[0].total_clicks).toBe(3)

    const dailyResult = await executeSQL(
      dbContext,
      'SELECT clicks FROM daily_link_clicks WHERE link_id = $1',
      [linkId]
    )
    expect(dailyResult.rows.length).toBe(1)
    expect(dailyResult.rows[0].clicks).toBe(3)
  })

  test('invalid linkId returns 404', async ({ request, appServer }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const response = await request.get(
      `${baseUrl}/go/00000000-0000-0000-0000-000000000000`,
      { maxRedirects: 0 }
    )

    expect(response.status()).toBe(404)
  })

  test('malformed linkId returns 404', async ({ request, appServer }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const response = await request.get(`${baseUrl}/go/not-a-valid-uuid`, {
      maxRedirects: 0,
    })

    expect(response.status()).toBe(404)
  })

  test('PublicLinkCard uses tracking URL', async ({
    page,
    appServer,
    dbContext,
  }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const userId = await seedUser(dbContext, 'alice')
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'uitest',
    })
    const linkId = await seedLink(dbContext, {
      biolinkId,
      emoji: '🔗',
      title: 'UI Test Link',
      url: 'https://ui.example.com',
      position: 0,
    })

    await page.goto(`${baseUrl}/uitest`)

    const linkCard = page.locator(`a[href="/go/${linkId}"]`)
    await expect(linkCard).toBeVisible()
    await expect(linkCard).toHaveAttribute('target', '_blank')
  })
})
