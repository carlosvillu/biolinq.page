# Authentication Conventions

This document defines the conventions for authentication and authorization in [PROJECT_NAME].

## Server vs Client

### Server-side (loaders/actions)

Use these helpers in React Router loaders and actions to protect routes:

- **`getCurrentUser(request)`** - Returns the current authenticated user or `null` if no session exists
  - Type: `Promise<AuthSession | null>`
  - Use when: You need to conditionally show content based on auth state
  - Import from: `app/lib/auth.server.ts`

- **`requireAuth(request)`** - Enforces authentication, redirects to login if not authenticated
  - Type: `Promise<AuthSession>`
  - Use when: The route requires authentication
  - Throws: `redirect('/auth/login?redirect=/original-path')` if not authenticated
  - Import from: `app/lib/auth.server.ts`

**Example:**

```typescript
import { requireAuth } from '~/lib/auth.server'

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireAuth(request)
  return { user }
}
```

### Client-side (components)

Use the existing hook for client-side session access:

- **`useSession()`** - Returns current session data from Better Auth
  - Returns: `{ data, isPending, error }`
  - Use when: You need session data in a React component
  - Import from: `app/lib/auth.client.ts`

**Example:**

```typescript
import { useSession } from '~/lib/auth.client'

export function MyComponent() {
  const { data: session, isPending } = useSession()

  if (isPending) return <div>Loading...</div>
  if (!session) return <div>Not logged in</div>

  return <div>Welcome, {session.user.email}</div>
}
```

## Why This Separation?

- **Server helpers** have access to request headers for cookie-based authentication
- **Client hook** uses Better Auth's client-side session management
- **Never import `auth.server.ts` in client code** - it will fail (server-only code)

## Redirect Flow

When an unauthenticated user tries to access a protected route:

1. `requireAuth()` throws a redirect to `/auth/login?redirect=/original-path`
2. User logs in successfully (email/password or Google OAuth)
3. Login page reads the `redirect` query parameter
4. User is redirected back to `/original-path`

This ensures users don't lose their navigation context when forced to authenticate.

**Note:** For Google OAuth, the `GoogleAuthButton` component receives `callbackURL` prop from the login/signup pages, which pass the `redirect` query parameter to Better Auth's `signIn.social()` method.

## Testing

### Option 1: Full Signup Flow (Recommended for simple tests)

Use the full signup flow in E2E tests. This is the simplest approach:

```typescript
test('authenticated user can access protected route', async ({ page }) => {
  // Signup creates user, account, and session
  await page.goto('/auth/signup')
  await page.getByPlaceholder('you@email.com').fill('test@example.com')
  await page.getByPlaceholder('Minimum 8 characters').fill('password123')
  await page.getByPlaceholder('Repeat your password').fill('password123')
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.waitForURL('/')

  // Navigate to protected route (example)
  await page.goto('/protected')
  await expect(page.getByRole('heading', { name: /protected/i })).toBeVisible()
})
```

### Option 2: API-based Session Creation (Recommended for faster tests)

Use the `createAuthSession` helper to create sessions via Better Auth API:

```typescript
import { createAuthSession, setAuthCookie } from '../helpers/auth'
import { FIXTURES } from '../fixtures'

test('authenticated user can access protected route', async ({ page, context, appServer }) => {
  const baseUrl = `http://localhost:${appServer.port}`

  // Create session via Better Auth API
  const { token } = await createAuthSession(baseUrl, {
    email: FIXTURES.users.testUser.email,
    password: 'password123',
  })

  // Set the signed cookie in browser context
  await setAuthCookie(context, token)

  // Navigate to protected route (example)
  await page.goto('/protected')
  await expect(page.getByRole('heading', { name: /protected/i })).toBeVisible()
})
```

### ⚠️ Direct DB Seeding Does NOT Work

**Do NOT** seed sessions directly in the database and set cookies manually. Better Auth uses **signed cookies** - the token in the cookie must be cryptographically signed with `BETTER_AUTH_SECRET`. Manually seeded tokens will not be recognized.

See `docs/TESTING.md` for more details on testing authenticated routes.
