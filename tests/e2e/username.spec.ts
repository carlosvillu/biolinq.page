import { test, expect } from '../fixtures/app.fixture'
import { createAuthSession } from '../helpers/auth'

test.describe('Username Service', () => {
  test('check availability returns true for valid username', async ({ baseURL }) => {
    const response = await fetch(`${baseURL}/api/__test__/username?username=validuser123`)
    expect(response.ok).toBe(true)

    const data = await response.json()
    expect(data).toEqual({ available: true })
  })

  test('check availability returns false for reserved username', async ({ baseURL }) => {
    const response = await fetch(`${baseURL}/api/__test__/username?username=admin`)
    expect(response.ok).toBe(true)

    const data = await response.json()
    expect(data).toEqual({ available: false, reason: 'USERNAME_RESERVED' })
  })

  test('check availability returns false for taken username', async ({ baseURL }) => {
    const timestamp = Date.now()
    const email = `taken-user-${timestamp}@example.com`

    // Create a user first
    const { userId } = await createAuthSession(baseURL!, {
      email,
      password: 'TestPassword123!',
    })

    // Register a username for this user
    const registerResponse = await fetch(`${baseURL}/api/__test__/username`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username: `taken${timestamp.toString().slice(-8)}` }),
    })
    if (!registerResponse.ok) {
      const text = await registerResponse.text()
      throw new Error(`Register failed: ${registerResponse.status} - ${text}`)
    }
    const registerData = await registerResponse.json()
    expect(registerData.success).toBe(true)

    // Check availability - should be taken
    const checkResponse = await fetch(
      `${baseURL}/api/__test__/username?username=taken${timestamp.toString().slice(-8)}`
    )
    expect(checkResponse.ok).toBe(true)

    const data = await checkResponse.json()
    expect(data).toEqual({ available: false, reason: 'USERNAME_TAKEN' })
  })

  test('register username creates biolink successfully', async ({ baseURL }) => {
    const timestamp = Date.now()
    const email = `register-user-${timestamp}@example.com`

    // Create a user first
    const { userId } = await createAuthSession(baseURL!, {
      email,
      password: 'TestPassword123!',
    })

    // Register a username
    const response = await fetch(`${baseURL}/api/__test__/username`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username: `new${timestamp.toString().slice(-8)}` }),
    })
    expect(response.ok).toBe(true)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.biolink).toBeDefined()
    expect(data.biolink.username).toBe(`new${timestamp.toString().slice(-8)}`)
    expect(data.biolink.userId).toBe(userId)
  })

  test('register username fails for reserved username', async ({ baseURL }) => {
    const timestamp = Date.now()
    const email = `reserved-user-${timestamp}@example.com`

    // Create a user first
    const { userId } = await createAuthSession(baseURL!, {
      email,
      password: 'TestPassword123!',
    })

    // Try to register a reserved username
    const response = await fetch(`${baseURL}/api/__test__/username`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username: 'dashboard' }),
    })
    expect(response.ok).toBe(true)

    const data = await response.json()
    expect(data).toEqual({ success: false, error: 'USERNAME_RESERVED' })
  })

  test('register username fails if user already has biolink', async ({ baseURL }) => {
    const timestamp = Date.now()
    const email = `double-user-${timestamp}@example.com`

    // Create a user first
    const { userId } = await createAuthSession(baseURL!, {
      email,
      password: 'TestPassword123!',
    })

    // Register first username
    const firstResponse = await fetch(`${baseURL}/api/__test__/username`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username: `first${timestamp.toString().slice(-8)}` }),
    })
    if (!firstResponse.ok) {
      const text = await firstResponse.text()
      throw new Error(`Register failed: ${firstResponse.status} - ${text}`)
    }
    const firstData = await firstResponse.json()
    expect(firstData.success).toBe(true)

    // Try to register second username for same user
    const secondResponse = await fetch(`${baseURL}/api/__test__/username`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username: `second${timestamp.toString().slice(-7)}` }),
    })
    expect(secondResponse.ok).toBe(true)

    const data = await secondResponse.json()
    expect(data).toEqual({ success: false, error: 'USER_ALREADY_HAS_BIOLINK' })
  })

  test('check availability returns 400 without username param', async ({ baseURL }) => {
    const response = await fetch(`${baseURL}/api/__test__/username`)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('username query param is required')
  })
})
