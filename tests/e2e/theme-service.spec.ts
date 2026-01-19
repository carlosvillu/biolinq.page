import { test, expect, seedUser, seedBiolink } from '../fixtures'
import { resetDatabase, executeSQL } from '../helpers/db'

test.describe('Theme Service', () => {
  test.beforeEach(async ({ dbContext }) => {
    await resetDatabase(dbContext)
  })

  test.describe('updateBiolinkTheme', () => {
    test('any user can change theme', async ({ request, appServer, dbContext }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const userId = await seedUser(dbContext, 'alice')
      const biolinkId = await seedBiolink(dbContext, {
        userId,
        username: 'alice',
        theme: 'brutalist',
      })

      const response = await request.post(
        `${baseUrl}/api/__test__/theme?intent=updateTheme`,
        {
          data: { biolinkId, theme: 'dark_mode' },
        }
      )

      expect(response.ok()).toBe(true)
      const result = await response.json()
      expect(result).toEqual({ success: true })

      const dbResult = await executeSQL(
        dbContext,
        'SELECT theme FROM biolinks WHERE id = $1',
        [biolinkId]
      )
      expect(dbResult.rows[0].theme).toBe('dark_mode')
    })

    test('invalid theme returns error', async ({ request, appServer, dbContext }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const userId = await seedUser(dbContext, 'alice')
      const biolinkId = await seedBiolink(dbContext, {
        userId,
        username: 'alice',
      })

      const response = await request.post(
        `${baseUrl}/api/__test__/theme?intent=updateTheme`,
        {
          data: { biolinkId, theme: 'invalid_theme' },
        }
      )

      expect(response.ok()).toBe(false)
      expect(response.status()).toBe(400)
    })

    test('non-existent biolink returns error', async ({
      request,
      appServer,
      dbContext,
    }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      await seedUser(dbContext, 'alice')

      const response = await request.post(
        `${baseUrl}/api/__test__/theme?intent=updateTheme`,
        {
          data: {
            biolinkId: '00000000-0000-0000-0000-000000000000',
            theme: 'brutalist',
          },
        }
      )

      expect(response.ok()).toBe(true)
      const result = await response.json()
      expect(result).toEqual({ success: false, error: 'BIOLINK_NOT_FOUND' })
    })
  })

  test.describe('updateBiolinkColors', () => {
    test('free user cannot save custom colors', async ({
      request,
      appServer,
      dbContext,
    }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const userId = await seedUser(dbContext, 'alice', { isPremium: false })
      const biolinkId = await seedBiolink(dbContext, {
        userId,
        username: 'alice',
      })

      const response = await request.post(
        `${baseUrl}/api/__test__/theme?intent=updateColors`,
        {
          data: { biolinkId, primaryColor: '#FF0000', bgColor: null },
        }
      )

      expect(response.ok()).toBe(true)
      const result = await response.json()
      expect(result).toEqual({ success: false, error: 'PREMIUM_REQUIRED' })
    })

    test('premium user can save custom colors', async ({
      request,
      appServer,
      dbContext,
    }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const userId = await seedUser(dbContext, 'alice', { isPremium: true })
      const biolinkId = await seedBiolink(dbContext, {
        userId,
        username: 'alice',
      })

      const response = await request.post(
        `${baseUrl}/api/__test__/theme?intent=updateColors`,
        {
          data: { biolinkId, primaryColor: '#FF0000', bgColor: '#000000' },
        }
      )

      expect(response.ok()).toBe(true)
      const result = await response.json()
      expect(result).toEqual({ success: true })

      const dbResult = await executeSQL(
        dbContext,
        'SELECT custom_primary_color, custom_bg_color FROM biolinks WHERE id = $1',
        [biolinkId]
      )
      expect(dbResult.rows[0].custom_primary_color).toBe('#FF0000')
      expect(dbResult.rows[0].custom_bg_color).toBe('#000000')
    })

    test('premium user can clear custom colors (set to null)', async ({
      request,
      appServer,
      dbContext,
    }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const userId = await seedUser(dbContext, 'alice', { isPremium: true })
      const biolinkId = await seedBiolink(dbContext, {
        userId,
        username: 'alice',
        customPrimaryColor: '#FF0000',
        customBgColor: '#000000',
      })

      const response = await request.post(
        `${baseUrl}/api/__test__/theme?intent=updateColors`,
        {
          data: { biolinkId, primaryColor: null, bgColor: null },
        }
      )

      expect(response.ok()).toBe(true)
      const result = await response.json()
      expect(result).toEqual({ success: true })

      const dbResult = await executeSQL(
        dbContext,
        'SELECT custom_primary_color, custom_bg_color FROM biolinks WHERE id = $1',
        [biolinkId]
      )
      expect(dbResult.rows[0].custom_primary_color).toBeNull()
      expect(dbResult.rows[0].custom_bg_color).toBeNull()
    })

    test('invalid color format returns error', async ({
      request,
      appServer,
      dbContext,
    }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const userId = await seedUser(dbContext, 'alice', { isPremium: true })
      const biolinkId = await seedBiolink(dbContext, {
        userId,
        username: 'alice',
      })

      const response = await request.post(
        `${baseUrl}/api/__test__/theme?intent=updateColors`,
        {
          data: { biolinkId, primaryColor: 'not-a-color', bgColor: null },
        }
      )

      expect(response.ok()).toBe(true)
      const result = await response.json()
      expect(result).toEqual({ success: false, error: 'INVALID_COLOR_FORMAT' })
    })

    test('non-existent biolink returns error (colors)', async ({
      request,
      appServer,
      dbContext,
    }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      await seedUser(dbContext, 'alice', { isPremium: true })

      const response = await request.post(
        `${baseUrl}/api/__test__/theme?intent=updateColors`,
        {
          data: {
            biolinkId: '00000000-0000-0000-0000-000000000000',
            primaryColor: '#FF0000',
            bgColor: null,
          },
        }
      )

      expect(response.ok()).toBe(true)
      const result = await response.json()
      expect(result).toEqual({ success: false, error: 'BIOLINK_NOT_FOUND' })
    })
  })
})
