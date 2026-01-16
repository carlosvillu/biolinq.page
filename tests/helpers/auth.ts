/**
 * ⚠️ TEST-ONLY HELPER
 *
 * This file is located in tests/helpers/ and should NEVER be imported
 * from application code (app/). It is only for E2E test usage.
 *
 * The helper calls Better Auth's signup endpoint to create valid sessions
 * with properly signed cookies for testing authenticated routes.
 */

// Fail fast if accidentally imported outside of test environment
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  throw new Error('tests/helpers/auth.ts cannot be imported in production')
}

export type AuthResult = {
  token: string
  userId: string
}

/**
 * Creates a user via Better Auth API and returns the session token.
 * This ensures the session is properly created and signed by Better Auth.
 *
 * @warning TEST-ONLY - Do not use outside of E2E tests
 */
export async function createAuthSession(
  baseUrl: string,
  options: {
    email: string
    password: string
    name?: string
  }
): Promise<AuthResult> {
  const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: options.email,
      password: options.password,
      name: options.name ?? 'Test User',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create auth session: ${response.status} - ${error}`)
  }

  const data = await response.json()

  // Extract session token from Set-Cookie header
  const setCookie = response.headers.get('set-cookie')
  if (!setCookie) {
    throw new Error('No Set-Cookie header in response')
  }

  // Parse the session token from the cookie
  const tokenMatch = setCookie.match(/better-auth\.session_token=([^;]+)/)
  if (!tokenMatch) {
    throw new Error('Session token not found in Set-Cookie header')
  }

  return {
    token: tokenMatch[1],
    userId: data.user.id,
  }
}

/**
 * Sets the session cookie in the browser context.
 * The token must be obtained from createAuthSession to be properly signed.
 */
export async function setAuthCookie(
  context: { addCookies: (cookies: Array<{ name: string; value: string; domain: string; path: string }>) => Promise<void> },
  token: string
): Promise<void> {
  await context.addCookies([
    {
      name: 'better-auth.session_token',
      value: token,
      domain: 'localhost',
      path: '/',
    },
  ])
}
