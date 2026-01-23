import Stripe from 'stripe'
import { test, expect } from '../fixtures/app.fixture'
import { createAuthSession } from '../helpers/auth'

// Webhook secret usado en el fixture app.fixture.ts
const WEBHOOK_SECRET = 'whsec_test_secret_for_e2e'

test.describe('Stripe Webhook Handler', () => {
  test('rejects requests without stripe-signature header', async ({ baseURL }) => {
    const response = await fetch(`${baseURL}/api/stripe/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'checkout.session.completed' })
    })

    expect(response.status).toBe(400)
    const text = await response.text()
    expect(text).toContain('Missing stripe-signature header')
  })

  test('rejects requests with invalid signature', async ({ baseURL }) => {
    const response = await fetch(`${baseURL}/api/stripe/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'invalid_signature'
      },
      body: JSON.stringify({ type: 'checkout.session.completed' })
    })

    expect(response.status).toBe(400)
    const text = await response.text()
    expect(text).toContain('Webhook Error')
  })

  test('returns 200 for unhandled event types', async ({ baseURL }) => {
    const payload = JSON.stringify({
      id: 'evt_test',
      type: 'customer.created',
      data: { object: {} }
    })

    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: WEBHOOK_SECRET
    })

    const response = await fetch(`${baseURL}/api/stripe/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature
      },
      body: payload
    })

    expect(response.status).toBe(200)
  })

  test('grants premium with valid signature on checkout.session.completed', async ({
    baseURL
  }) => {
    // Crear usuario de prueba
    const timestamp = Date.now()
    const email = `premium-test-${timestamp}@example.com`

    const { userId } = await createAuthSession(baseURL!, {
      email,
      password: 'TestPassword123!',
      name: 'Premium Test User'
    })

    // Verificar que el usuario NO es premium inicialmente
    const statusBeforeResponse = await fetch(
      `${baseURL}/api/__test__/premium?userId=${userId}`
    )
    expect(statusBeforeResponse.ok).toBe(true)
    const statusBefore = await statusBeforeResponse.json()
    expect(statusBefore.isPremium).toBe(false)
    expect(statusBefore.stripeCustomerId).toBe(null)

    // Construir evento de Stripe checkout.session.completed
    const payload = JSON.stringify({
      id: 'evt_test',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          customer: 'cus_test_xyz',
          metadata: {
            userId
          }
        }
      }
    })

    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: WEBHOOK_SECRET
    })

    // Enviar webhook
    const webhookResponse = await fetch(`${baseURL}/api/stripe/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature
      },
      body: payload
    })

    expect(webhookResponse.status).toBe(200)

    // Verificar que el usuario ahora ES premium
    const statusAfterResponse = await fetch(
      `${baseURL}/api/__test__/premium?userId=${userId}`
    )
    expect(statusAfterResponse.ok).toBe(true)
    const statusAfter = await statusAfterResponse.json()
    expect(statusAfter.isPremium).toBe(true)
    expect(statusAfter.stripeCustomerId).toBe('cus_test_xyz')
  })
})

test.describe('Premium Service', () => {
  test('grants premium status to user', async ({ baseURL }) => {
    // Crear usuario de prueba
    const timestamp = Date.now()
    const email = `premium-service-${timestamp}@example.com`

    const { userId } = await createAuthSession(baseURL!, {
      email,
      password: 'TestPassword123!',
      name: 'Premium Service Test'
    })

    // Verificar que el usuario NO es premium inicialmente
    const statusBeforeResponse = await fetch(
      `${baseURL}/api/__test__/premium?userId=${userId}`
    )
    expect(statusBeforeResponse.ok).toBe(true)
    const statusBefore = await statusBeforeResponse.json()
    expect(statusBefore.isPremium).toBe(false)

    // Otorgar premium
    const grantResponse = await fetch(`${baseURL}/api/__test__/premium`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        stripeCustomerId: 'cus_test123'
      })
    })

    expect(grantResponse.ok).toBe(true)
    const grantData = await grantResponse.json()
    expect(grantData.success).toBe(true)

    // Verificar que el usuario ahora ES premium
    const statusAfterResponse = await fetch(
      `${baseURL}/api/__test__/premium?userId=${userId}`
    )
    expect(statusAfterResponse.ok).toBe(true)
    const statusAfter = await statusAfterResponse.json()
    expect(statusAfter.isPremium).toBe(true)
    expect(statusAfter.stripeCustomerId).toBe('cus_test123')
  })

  test('is idempotent - already premium user', async ({ baseURL }) => {
    // Crear usuario de prueba
    const timestamp = Date.now()
    const email = `premium-idempotent-${timestamp}@example.com`

    const { userId } = await createAuthSession(baseURL!, {
      email,
      password: 'TestPassword123!',
      name: 'Idempotent Test'
    })

    // Otorgar premium por primera vez
    const firstGrantResponse = await fetch(`${baseURL}/api/__test__/premium`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        stripeCustomerId: 'cus_first123'
      })
    })
    expect(firstGrantResponse.ok).toBe(true)

    // Verificar estado después de la primera vez
    const statusAfterFirstResponse = await fetch(
      `${baseURL}/api/__test__/premium?userId=${userId}`
    )
    expect(statusAfterFirstResponse.ok).toBe(true)
    const statusAfterFirst = await statusAfterFirstResponse.json()
    expect(statusAfterFirst.isPremium).toBe(true)
    expect(statusAfterFirst.stripeCustomerId).toBe('cus_first123')

    // Intentar otorgar premium de nuevo con diferente customer ID
    const secondGrantResponse = await fetch(`${baseURL}/api/__test__/premium`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        stripeCustomerId: 'cus_new456'
      })
    })
    expect(secondGrantResponse.ok).toBe(true)

    // Verificar que el estado NO cambió (idempotencia)
    const statusAfterSecondResponse = await fetch(
      `${baseURL}/api/__test__/premium?userId=${userId}`
    )
    expect(statusAfterSecondResponse.ok).toBe(true)
    const statusAfterSecond = await statusAfterSecondResponse.json()
    expect(statusAfterSecond.isPremium).toBe(true)
    // El stripeCustomerId NO debe haber cambiado porque ya era premium
    expect(statusAfterSecond.stripeCustomerId).toBe('cus_first123')
  })
})
