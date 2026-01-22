import { test, expect, seedUser, seedBiolink } from '../fixtures'
import { resetDatabase, executeSQL } from '../helpers/db'

test.describe('Public Page Caching', () => {
  test.beforeEach(async ({ dbContext }) => {
    await resetDatabase(dbContext)
  })

  test('public page has cache headers', async ({ request, appServer, dbContext }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const userId = await seedUser(dbContext, 'alice')
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'cachetest',
    })

    const response = await request.get(`${baseUrl}/cachetest`)

    expect(response.status()).toBe(200)

    const cacheControl = response.headers()['cache-control']
    expect(cacheControl).toContain('s-maxage=3600')
    expect(cacheControl).toContain('max-age=60')
    expect(cacheControl).toContain('public')

    const surrogateKey = response.headers()['surrogate-key']
    expect(surrogateKey).toBe(`biolink-${biolinkId}`)
  })

  test('preview mode disables cache', async ({ request, appServer, dbContext }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const userId = await seedUser(dbContext, 'alice')
    await seedBiolink(dbContext, {
      userId,
      username: 'previewtest',
    })

    const response = await request.get(`${baseUrl}/previewtest?preview=1`)

    expect(response.status()).toBe(200)

    const cacheControl = response.headers()['cache-control']
    expect(cacheControl).toBe('no-store')

    const surrogateKey = response.headers()['surrogate-key']
    expect(surrogateKey).toBeUndefined()
  })

  test('public page does NOT set tracking cookie', async ({ request, appServer, dbContext }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const userId = await seedUser(dbContext, 'alice')
    await seedBiolink(dbContext, {
      userId,
      username: 'nocookietest',
    })

    const response = await request.get(`${baseUrl}/nocookietest`)

    expect(response.status()).toBe(200)

    const setCookie = response.headers()['set-cookie']
    if (setCookie) {
      expect(setCookie).not.toContain('_blv')
    }
  })

  test('/api/px endpoint increments views', async ({ request, appServer, dbContext }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const userId = await seedUser(dbContext, 'alice')
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'pxtest',
    })

    const response = await request.post(`${baseUrl}/api/px`, {
      data: { id: biolinkId },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.ok).toBe(true)

    const result = await executeSQL(
      dbContext,
      'SELECT total_views FROM biolinks WHERE id = $1',
      [biolinkId]
    )
    expect(result.rows[0].total_views).toBe(1)
  })

  test('/api/px endpoint rejects GET requests', async ({ request, appServer }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const response = await request.get(`${baseUrl}/api/px`)

    expect(response.status()).toBe(405)
    const body = await response.json()
    expect(body.ok).toBe(false)
  })

  test('/api/px endpoint validates UUID', async ({ request, appServer }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const response = await request.post(`${baseUrl}/api/px`, {
      data: { id: 'invalid-uuid' },
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.ok).toBe(false)
  })

  test('/api/px endpoint rejects missing id', async ({ request, appServer }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const response = await request.post(`${baseUrl}/api/px`, {
      data: {},
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.ok).toBe(false)
  })

  test('client-side tracking via page visit', async ({ page, appServer, dbContext }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const userId = await seedUser(dbContext, 'alice')
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'clienttracktest',
    })

    await page.goto(`${baseUrl}/clienttracktest`)

    await page.waitForTimeout(500)

    const result = await executeSQL(
      dbContext,
      'SELECT total_views FROM biolinks WHERE id = $1',
      [biolinkId]
    )
    expect(result.rows[0].total_views).toBe(1)
  })

  test('client-side deduplication prevents multiple views in same session', async ({
    page,
    appServer,
    dbContext,
  }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const userId = await seedUser(dbContext, 'alice')
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'deduptest',
    })

    await page.goto(`${baseUrl}/deduptest`)
    await page.waitForTimeout(500)

    await page.goto(`${baseUrl}/deduptest`)
    await page.waitForTimeout(500)

    const result = await executeSQL(
      dbContext,
      'SELECT total_views FROM biolinks WHERE id = $1',
      [biolinkId]
    )
    expect(result.rows[0].total_views).toBe(1)
  })

  test('preview mode does not track views', async ({ page, appServer, dbContext }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const userId = await seedUser(dbContext, 'alice')
    const biolinkId = await seedBiolink(dbContext, {
      userId,
      username: 'previewnotrack',
    })

    await page.goto(`${baseUrl}/previewnotrack?preview=1`)
    await page.waitForTimeout(500)

    const result = await executeSQL(
      dbContext,
      'SELECT total_views FROM biolinks WHERE id = $1',
      [biolinkId]
    )
    expect(result.rows[0].total_views).toBe(0)
  })
})
