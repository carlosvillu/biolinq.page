import { test, expect } from '../fixtures/app.fixture'
import { seedBiolink, seedLink } from '../fixtures/seeders'
import { resetDatabase } from '../helpers/db'
import { createAuthSession, setAuthCookie } from '../helpers/auth'

test.describe('Dashboard Tracking', () => {
  test.beforeEach(async ({ dbContext, context }) => {
    await resetDatabase(dbContext)
    // Accept analytics consent so GA loads - use addInitScript to set before page loads
    await context.addInitScript(() => {
      localStorage.setItem('biolinq_analytics_consent', 'accepted')
    })
  })

  test.describe('User Properties on Dashboard', () => {
    test('sets user_type=free, has_biolink=true, link_count for free user', async ({
      page,
      context,
      appServer,
      dbContext,
    }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const { token } = await createAuthSession(baseUrl, {
        email: 'freeuser@test.com',
        password: 'password123',
        name: 'Free User',
      })

      await setAuthCookie(context, token)

      const userId = (
        await (
          await fetch(`${baseUrl}/api/auth/get-session`, {
            headers: { Cookie: `better-auth.session_token=${token}` },
          })
        ).json()
      ).user.id

      const biolinkId = await seedBiolink(dbContext, {
        userId,
        username: 'freeuser',
      })

      await seedLink(dbContext, {
        biolinkId,
        title: 'Link 1',
        url: 'https://link1.com',
        position: 0,
      })
      await seedLink(dbContext, {
        biolinkId,
        title: 'Link 2',
        url: 'https://link2.com',
        position: 1,
      })

      await page.goto('/dashboard')

      await page.waitForFunction(
        () => typeof (window as Window & { dataLayer?: unknown[] }).dataLayer !== 'undefined'
      )
      await page.waitForTimeout(500)

      const dataLayer = await page.evaluate(() =>
        (window as Window & { dataLayer: unknown[] }).dataLayer.map((entry) =>
          Array.from(entry as ArrayLike<unknown>)
        )
      )

      const userTypeEntry = dataLayer.find(
        (entry: unknown[]) =>
          entry[0] === 'set' &&
          entry[1] === 'user_properties' &&
          (entry[2] as Record<string, unknown>)?.user_type !== undefined
      )
      const hasBiolinkEntry = dataLayer.find(
        (entry: unknown[]) =>
          entry[0] === 'set' &&
          entry[1] === 'user_properties' &&
          (entry[2] as Record<string, unknown>)?.has_biolink !== undefined
      )
      const linkCountEntry = dataLayer.find(
        (entry: unknown[]) =>
          entry[0] === 'set' &&
          entry[1] === 'user_properties' &&
          (entry[2] as Record<string, unknown>)?.link_count !== undefined
      )

      expect(userTypeEntry).toBeDefined()
      expect((userTypeEntry![2] as Record<string, unknown>).user_type).toBe('free')

      expect(hasBiolinkEntry).toBeDefined()
      expect((hasBiolinkEntry![2] as Record<string, unknown>).has_biolink).toBe(true)

      expect(linkCountEntry).toBeDefined()
      expect((linkCountEntry![2] as Record<string, unknown>).link_count).toBe(2)
    })

    test('sets user_type=premium for premium user', async ({
      page,
      context,
      appServer,
      dbContext,
    }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const { token } = await createAuthSession(baseUrl, {
        email: 'premiumuser@test.com',
        password: 'password123',
        name: 'Premium User',
      })

      await setAuthCookie(context, token)

      const userId = (
        await (
          await fetch(`${baseUrl}/api/auth/get-session`, {
            headers: { Cookie: `better-auth.session_token=${token}` },
          })
        ).json()
      ).user.id

      // Update user to premium
      await dbContext.client.query('UPDATE users SET is_premium = true WHERE id = $1', [userId])

      const biolinkId = await seedBiolink(dbContext, {
        userId,
        username: 'premiumuser',
      })

      await seedLink(dbContext, {
        biolinkId,
        title: 'Link 1',
        url: 'https://link1.com',
        position: 0,
      })
      await seedLink(dbContext, {
        biolinkId,
        title: 'Link 2',
        url: 'https://link2.com',
        position: 1,
      })
      await seedLink(dbContext, {
        biolinkId,
        title: 'Link 3',
        url: 'https://link3.com',
        position: 2,
      })

      await page.goto('/dashboard')

      await page.waitForFunction(
        () => typeof (window as Window & { dataLayer?: unknown[] }).dataLayer !== 'undefined'
      )
      await page.waitForTimeout(500)

      const dataLayer = await page.evaluate(() =>
        (window as Window & { dataLayer: unknown[] }).dataLayer.map((entry) =>
          Array.from(entry as ArrayLike<unknown>)
        )
      )

      const userTypeEntry = dataLayer.find(
        (entry: unknown[]) =>
          entry[0] === 'set' &&
          entry[1] === 'user_properties' &&
          (entry[2] as Record<string, unknown>)?.user_type !== undefined
      )
      const linkCountEntry = dataLayer.find(
        (entry: unknown[]) =>
          entry[0] === 'set' &&
          entry[1] === 'user_properties' &&
          (entry[2] as Record<string, unknown>)?.link_count !== undefined
      )

      expect(userTypeEntry).toBeDefined()
      expect((userTypeEntry![2] as Record<string, unknown>).user_type).toBe('premium')

      expect(linkCountEntry).toBeDefined()
      expect((linkCountEntry![2] as Record<string, unknown>).link_count).toBe(3)
    })
  })

  test.describe('User Properties on Account Page', () => {
    test('sets user_type and has_biolink but NOT link_count', async ({
      page,
      context,
      appServer,
      dbContext,
    }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const { token } = await createAuthSession(baseUrl, {
        email: 'accountuser@test.com',
        password: 'password123',
        name: 'Account User',
      })

      await setAuthCookie(context, token)

      const userId = (
        await (
          await fetch(`${baseUrl}/api/auth/get-session`, {
            headers: { Cookie: `better-auth.session_token=${token}` },
          })
        ).json()
      ).user.id

      await seedBiolink(dbContext, {
        userId,
        username: 'accountuser',
      })

      await page.goto('/dashboard/account')

      await page.waitForFunction(
        () => typeof (window as Window & { dataLayer?: unknown[] }).dataLayer !== 'undefined'
      )
      await page.waitForTimeout(500)

      const dataLayer = await page.evaluate(() =>
        (window as Window & { dataLayer: unknown[] }).dataLayer.map((entry) =>
          Array.from(entry as ArrayLike<unknown>)
        )
      )

      const userTypeEntry = dataLayer.find(
        (entry: unknown[]) =>
          entry[0] === 'set' &&
          entry[1] === 'user_properties' &&
          (entry[2] as Record<string, unknown>)?.user_type !== undefined
      )
      const hasBiolinkEntry = dataLayer.find(
        (entry: unknown[]) =>
          entry[0] === 'set' &&
          entry[1] === 'user_properties' &&
          (entry[2] as Record<string, unknown>)?.has_biolink !== undefined
      )
      const linkCountEntry = dataLayer.find(
        (entry: unknown[]) =>
          entry[0] === 'set' &&
          entry[1] === 'user_properties' &&
          (entry[2] as Record<string, unknown>)?.link_count !== undefined
      )

      expect(userTypeEntry).toBeDefined()
      expect((userTypeEntry![2] as Record<string, unknown>).user_type).toBe('free')

      expect(hasBiolinkEntry).toBeDefined()
      expect((hasBiolinkEntry![2] as Record<string, unknown>).has_biolink).toBe(true)

      // link_count should NOT be set on account page
      expect(linkCountEntry).toBeUndefined()
    })
  })

  test.describe('Delete Account Events', () => {
    test('fires delete_account_started when modal opens', async ({
      page,
      context,
      appServer,
      dbContext,
    }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const { token } = await createAuthSession(baseUrl, {
        email: 'deletestart@test.com',
        password: 'password123',
        name: 'Delete Start User',
      })

      await setAuthCookie(context, token)

      const userId = (
        await (
          await fetch(`${baseUrl}/api/auth/get-session`, {
            headers: { Cookie: `better-auth.session_token=${token}` },
          })
        ).json()
      ).user.id

      await seedBiolink(dbContext, {
        userId,
        username: 'deletestart',
      })

      await page.goto('/dashboard/account')

      await page.waitForFunction(
        () => typeof (window as Window & { dataLayer?: unknown[] }).dataLayer !== 'undefined'
      )

      // Click the delete account button to open modal (first one, the trigger)
      await page.getByRole('button', { name: /delete account/i }).first().click()

      // Wait for modal to appear
      await expect(page.getByRole('dialog')).toBeVisible()

      await page.waitForTimeout(300)

      const dataLayer = await page.evaluate(() =>
        (window as Window & { dataLayer: unknown[] }).dataLayer.map((entry) =>
          Array.from(entry as ArrayLike<unknown>)
        )
      )

      const deleteStartedEvent = dataLayer.find(
        (entry: unknown[]) => entry[0] === 'event' && entry[1] === 'delete_account_started'
      )

      expect(deleteStartedEvent).toBeDefined()
    })

    test('fires account_deleted when form is submitted', async ({
      page,
      context,
      appServer,
      dbContext,
    }) => {
      const baseUrl = `http://localhost:${appServer.port}`
      const username = 'deletecomplete'

      const { token } = await createAuthSession(baseUrl, {
        email: 'deletecomplete@test.com',
        password: 'password123',
        name: 'Delete Complete User',
      })

      await setAuthCookie(context, token)

      const userId = (
        await (
          await fetch(`${baseUrl}/api/auth/get-session`, {
            headers: { Cookie: `better-auth.session_token=${token}` },
          })
        ).json()
      ).user.id

      await seedBiolink(dbContext, {
        userId,
        username,
      })

      await page.goto('/dashboard/account')

      await page.waitForFunction(
        () => typeof (window as Window & { dataLayer?: unknown[] }).dataLayer !== 'undefined'
      )

      // Capture events before form submission causes navigation
      const capturedEvents: unknown[][] = []
      await page.exposeFunction('captureGtagEvent', (args: unknown[]) => {
        capturedEvents.push(args)
      })

      await page.evaluate(() => {
        const originalPush = (window as Window & { dataLayer: unknown[] }).dataLayer.push.bind(
          (window as Window & { dataLayer: unknown[] }).dataLayer
        )
        ;(window as Window & { dataLayer: unknown[] }).dataLayer.push = function (
          ...args: unknown[]
        ) {
          for (const arg of args) {
            const arr = Array.from(arg as ArrayLike<unknown>)
            if (arr[0] === 'event' && arr[1] === 'account_deleted') {
              ;(window as Window & { captureGtagEvent: (args: unknown[]) => void }).captureGtagEvent(
                arr
              )
            }
          }
          return originalPush(...args)
        }
      })

      // Open modal (first button is the trigger)
      await page.getByRole('button', { name: /delete account/i }).first().click()
      await expect(page.getByRole('dialog')).toBeVisible()

      // Type username to enable submit
      await page.getByPlaceholder(/type your username/i).fill(username)

      // Click confirm delete button (the submit button with "Delete My Account" text)
      await page.getByRole('button', { name: /delete my account/i }).click()

      // Wait for navigation (account deletion redirects to home)
      await page.waitForURL('/')

      // Verify the event was captured before navigation
      expect(capturedEvents.length).toBeGreaterThan(0)
      const accountDeletedEvent = capturedEvents.find(
        (entry: unknown[]) => entry[0] === 'event' && entry[1] === 'account_deleted'
      )

      expect(accountDeletedEvent).toBeDefined()
    })
  })

  test.describe('No PII in tracked data', () => {
    test('user properties do not contain email or name', async ({
      page,
      context,
      appServer,
      dbContext,
    }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const { token } = await createAuthSession(baseUrl, {
        email: 'nopii@test.com',
        password: 'password123',
        name: 'No PII User',
      })

      await setAuthCookie(context, token)

      const userId = (
        await (
          await fetch(`${baseUrl}/api/auth/get-session`, {
            headers: { Cookie: `better-auth.session_token=${token}` },
          })
        ).json()
      ).user.id

      await seedBiolink(dbContext, {
        userId,
        username: 'nopiiuser',
      })

      await page.goto('/dashboard')

      await page.waitForFunction(
        () => typeof (window as Window & { dataLayer?: unknown[] }).dataLayer !== 'undefined'
      )
      await page.waitForTimeout(500)

      const dataLayer = await page.evaluate(() =>
        (window as Window & { dataLayer: unknown[] }).dataLayer.map((entry) =>
          Array.from(entry as ArrayLike<unknown>)
        )
      )

      // Check all user_properties entries for PII
      const userPropertiesEntries = dataLayer.filter(
        (entry: unknown[]) => entry[0] === 'set' && entry[1] === 'user_properties'
      )

      for (const entry of userPropertiesEntries) {
        const props = entry[2] as Record<string, unknown>
        expect(props.email).toBeUndefined()
        expect(props.name).toBeUndefined()
        expect(props.full_name).toBeUndefined()
      }

      // Verify only expected properties are set
      const allPropertyKeys = userPropertiesEntries.flatMap((entry) =>
        Object.keys(entry[2] as Record<string, unknown>)
      )
      const allowedKeys = ['user_type', 'has_biolink', 'link_count', 'language', 'environment']
      for (const key of allPropertyKeys) {
        expect(allowedKeys).toContain(key)
      }
    })
  })
})
