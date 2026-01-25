import { test, expect } from '../fixtures/app.fixture'
import { seedBiolink } from '../fixtures/seeders'
import { resetDatabase } from '../helpers/db'
import { createAuthSession, setAuthCookie } from '../helpers/auth'

test.describe('Ecommerce Tracking', () => {
  test.beforeEach(async ({ dbContext, context }) => {
    await resetDatabase(dbContext)
    // Accept analytics consent so GA loads
    await context.addInitScript(() => {
      localStorage.setItem('biolinq_analytics_consent', 'accepted')
    })
  })

  test.describe('begin_checkout event', () => {
    test('fires when clicking Go Premium', async ({ page, context, appServer, dbContext }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const { token } = await createAuthSession(baseUrl, {
        email: 'checkout@test.com',
        password: 'password123',
        name: 'Checkout User',
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
        username: 'checkoutuser',
      })

      await page.goto('/dashboard')

      await page.waitForFunction(() => typeof (window as Window & { dataLayer?: unknown[] }).dataLayer !== 'undefined')

      // Capture dataLayer events via evaluate before form submission
      // We'll inject a listener to capture the begin_checkout event
      const capturedEvents: unknown[][] = []
      await page.exposeFunction('captureGtagEvent', (args: unknown[]) => {
        capturedEvents.push(args)
      })

      await page.evaluate(() => {
        const originalPush = (window as Window & { dataLayer: unknown[] }).dataLayer.push.bind(
          (window as Window & { dataLayer: unknown[] }).dataLayer
        )
        ;(window as Window & { dataLayer: unknown[] }).dataLayer.push = function (...args: unknown[]) {
          for (const arg of args) {
            const arr = Array.from(arg as ArrayLike<unknown>)
            if (arr[0] === 'event' && arr[1] === 'begin_checkout') {
              ;(window as Window & { captureGtagEvent: (args: unknown[]) => void }).captureGtagEvent(arr)
            }
          }
          return originalPush(...args)
        }
      })

      // Intercept the checkout request to prevent actual navigation to Stripe
      await page.route('**/api/stripe/checkout', async (route) => {
        await route.fulfill({
          status: 302,
          headers: { Location: '/dashboard' },
        })
      })

      await page.getByRole('button', { name: /go premium/i }).click()

      // Wait for the event to be captured
      await page.waitForTimeout(500)

      expect(capturedEvents.length).toBeGreaterThan(0)
      const beginCheckoutEvent = capturedEvents.find(
        (entry: unknown[]) => entry[0] === 'event' && entry[1] === 'begin_checkout'
      )

      expect(beginCheckoutEvent).toBeDefined()
      expect(beginCheckoutEvent![2]).toMatchObject({
        currency: 'EUR',
        value: 5.0,
        items: [{ item_name: 'BioLinq Premium', price: 5.0, quantity: 1 }],
      })
    })
  })

  test.describe('purchase event', () => {
    test('fires on successful upgrade redirect with session_id', async ({
      page,
      context,
      appServer,
      dbContext,
    }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const { token } = await createAuthSession(baseUrl, {
        email: 'purchase@test.com',
        password: 'password123',
        name: 'Purchase User',
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
        username: 'purchaseuser',
      })

      await page.goto('/dashboard?upgrade=success&session_id=cs_test_abc123')

      await page.waitForFunction(() => typeof (window as Window & { dataLayer?: unknown[] }).dataLayer !== 'undefined')
      await page.waitForTimeout(500)

      const dataLayer = await page.evaluate(() =>
        (window as Window & { dataLayer: unknown[] }).dataLayer.map((entry) =>
          Array.from(entry as ArrayLike<unknown>)
        )
      )
      const purchaseEvent = dataLayer.find(
        (entry: unknown[]) => entry[0] === 'event' && entry[1] === 'purchase'
      )

      expect(purchaseEvent).toBeDefined()
      expect(purchaseEvent![2]).toMatchObject({
        transaction_id: 'cs_test_abc123',
        value: 5.0,
        currency: 'EUR',
        items: [{ item_name: 'BioLinq Premium', price: 5.0, quantity: 1 }],
      })
    })

    test('does NOT fire without session_id', async ({ page, context, appServer, dbContext }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const { token } = await createAuthSession(baseUrl, {
        email: 'nopurchase@test.com',
        password: 'password123',
        name: 'No Purchase User',
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
        username: 'nopurchaseuser',
      })

      await page.goto('/dashboard?upgrade=success')

      await page.waitForFunction(() => typeof (window as Window & { dataLayer?: unknown[] }).dataLayer !== 'undefined')
      await page.waitForTimeout(500)

      const dataLayer = await page.evaluate(() =>
        (window as Window & { dataLayer: unknown[] }).dataLayer.map((entry) =>
          Array.from(entry as ArrayLike<unknown>)
        )
      )
      const purchaseEvent = dataLayer.find(
        (entry: unknown[]) => entry[0] === 'event' && entry[1] === 'purchase'
      )

      expect(purchaseEvent).toBeUndefined()
    })

    test('cleans URL params after firing', async ({ page, context, appServer, dbContext }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const { token } = await createAuthSession(baseUrl, {
        email: 'cleanurl@test.com',
        password: 'password123',
        name: 'Clean URL User',
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
        username: 'cleanurluser',
      })

      await page.goto('/dashboard?upgrade=success&session_id=cs_test_xyz')

      await page.waitForURL('/dashboard')

      const url = page.url()
      expect(url).not.toContain('upgrade=')
      expect(url).not.toContain('session_id=')
    })
  })

  test.describe('user_id tracking', () => {
    test('is set in gtag config for authenticated users', async ({
      page,
      context,
      appServer,
      dbContext,
    }) => {
      const baseUrl = `http://localhost:${appServer.port}`

      const { token } = await createAuthSession(baseUrl, {
        email: 'userid@test.com',
        password: 'password123',
        name: 'User ID User',
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
        username: 'useriduser',
      })

      await page.goto('/dashboard')

      await page.waitForFunction(() => typeof (window as Window & { dataLayer?: unknown[] }).dataLayer !== 'undefined')

      const dataLayer = await page.evaluate(() =>
        (window as Window & { dataLayer: unknown[] }).dataLayer.map((entry) =>
          Array.from(entry as ArrayLike<unknown>)
        )
      )

      const configEntry = dataLayer.find(
        (entry: unknown[]) =>
          entry[0] === 'config' &&
          typeof entry[1] === 'string' &&
          entry[1].startsWith('G-') &&
          (entry[2] as Record<string, unknown>)?.user_id
      )

      expect(configEntry).toBeDefined()
      expect((configEntry![2] as Record<string, unknown>).user_id).toMatch(/^[a-f0-9]{16}$/)
    })

    test('is NOT set for unauthenticated users', async ({ page }) => {
      await page.goto('/')

      await page.waitForFunction(() => typeof (window as Window & { dataLayer?: unknown[] }).dataLayer !== 'undefined')

      const dataLayer = await page.evaluate(() =>
        (window as Window & { dataLayer: unknown[] }).dataLayer.map((entry) =>
          Array.from(entry as ArrayLike<unknown>)
        )
      )

      const configEntry = dataLayer.find(
        (entry: unknown[]) =>
          entry[0] === 'config' &&
          typeof entry[1] === 'string' &&
          entry[1].startsWith('G-')
      )

      expect(configEntry).toBeDefined()
      expect((configEntry![2] as Record<string, unknown>)?.user_id).toBeUndefined()
    })
  })
})
