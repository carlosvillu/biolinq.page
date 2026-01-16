# Testing Guide

This project uses **Playwright E2E tests** with TestContainers for database isolation.

| Framework | Location | Command |
|-----------|----------|---------|
| Playwright E2E | `tests/e2e/` | `npm run test:e2e` |

---

## E2E Testing (Playwright + TestContainers)

### Prerequisites

- **Docker Desktop** must be running before executing tests
- Tests use PostgreSQL 16 containers via TestContainers

### Commands

```bash
npm run test:e2e              # Run all E2E tests (fail-fast, list reporter)
npm run test:e2e -- --retries=1  # Run with 1 retry
```

---

## Testing Architecture

## Why This Architecture?

### The Problem We Solved

Previously, E2E tests had a critical disconnect:

1. **Tests** seeded data into TestContainers (isolated PostgreSQL)
2. **Server** (`npm run dev`) connected to Neon Dev (`.env.development`)
3. **Result:** Tests seeded data the server couldn't see → UI tests failed

### The Solution: Worker-Scoped Fixtures

Each **Playwright worker** now has its own complete stack:

```
Worker 0                          Worker 1
+------------------+              +------------------+
| TestContainers   |              | TestContainers   |
| PostgreSQL:xxxxx |              | PostgreSQL:yyyyy |
+--------+---------+              +--------+---------+
         |                                 |
         | DB_TEST_URL                     | DB_TEST_URL
         v                                 v
+------------------+              +------------------+
| App Server       |              | App Server       |
| PORT=4000        |              | PORT=4001        |
+--------+---------+              +--------+---------+
         |                                 |
         v                                 v
+------------------+              +------------------+
| Tests            |              | Tests            |
| baseURL=4000     |              | baseURL=4001     |
| dbContext=ctx0   |              | dbContext=ctx1   |
+------------------+              +------------------+
```

**Key insight:** The server receives `DB_TEST_URL` which has priority over `DATABASE_URL` in `app/db/index.ts`. This makes the server use the `pg` driver (TCP) instead of `@neondatabase/serverless` (HTTP), connecting to the same TestContainers database that the tests seed.

### Directory Structure

```
tests/
├── e2e/                    # Playwright test files
│   ├── smoke.spec.ts       # Basic app tests
│   └── *.spec.ts           # DB tests use fixtures
├── fixtures/
│   ├── index.ts            # Re-exports everything (test, expect, seeders)
│   ├── app.fixture.ts      # Worker-scoped fixtures (dbContext, appServer)
│   ├── data.ts             # Centralized fixture data
│   └── seeders.ts          # Semantic helpers to insert data
└── helpers/
    └── db.ts               # TestContainers helpers
```

## Semantic Fixtures (MUST USE)

**DO NOT write raw SQL in tests.** Use semantic seeders instead.

### Why Semantic Fixtures?

1. **Readable tests** - `seedUser(dbContext, 'podcaster')` vs raw INSERT
2. **Centralized data** - All test data in `fixtures/data.ts`
3. **Type-safe** - TypeScript ensures valid fixture keys
4. **Maintainable** - Change data in one place, all tests updated

### Usage Pattern

```typescript
import { test, expect, seedUser, FIXTURES } from '../fixtures'
import { resetDatabase } from '../helpers/db'

test.beforeEach(async ({ dbContext }) => {
  await resetDatabase(dbContext)
})

test('can insert and read a user', async ({ dbContext }) => {
  const userId = await seedUser(dbContext, 'testUser')
  // Verify with executeSQL...
})

test('can view user in UI', async ({ page, dbContext }) => {
  await seedUser(dbContext, 'testUser')
  await page.goto('/users')
  await expect(page.getByText(FIXTURES.users.testUser.email)).toBeVisible()
})
```

**Key Points:**

- `dbContext` is a worker-scoped fixture containing the TestContainers connection
- `page` automatically points to the worker's server (port 4000 + workerIndex)
- The server uses the same DB as the seeders (via `DB_TEST_URL`)
- **DO NOT** use `let ctx` at file level - use the `dbContext` fixture
- **DO NOT** import from `@playwright/test` - import from `../fixtures`

## Adding New Fixtures

### Step 1: Add Data to `fixtures/data.ts`

```typescript
export const FIXTURES = {
  users: {
    testUser: { email: 'test@example.com', name: 'Test User' },
    anotherUser: { email: 'another@example.com', name: 'Another User' },
    // Add new user fixture here
  },
  // Add new entity types here as your project grows
}
```

### Step 2: Add Seeder to `fixtures/seeders.ts`

Example seeder for users:

```typescript
export async function seedUser(
  ctx: DbContext,
  key: keyof typeof FIXTURES.users,
  overrides?: Partial<(typeof FIXTURES.users)[typeof key]>
): Promise<string> {
  const data = { ...FIXTURES.users[key], ...overrides }
  const result = await executeSQL(
    ctx,
    'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING id',
    [data.email, data.name]
  )
  return result.rows[0].id
}
```

### Step 3: Export from `fixtures/index.ts`

The seeder is automatically exported via `export * from './seeders'`.

## Helper Functions Reference

### `tests/helpers/db.ts`

| Function                        | Description                                 |
| ------------------------------- | ------------------------------------------- |
| `startPostgresContainer()`      | Starts PG 16 container, returns `DbContext` |
| `stopPostgresContainer(ctx)`    | Stops container and closes connection       |
| `resetDatabase(ctx)`            | Truncates all tables, preserves schema      |
| `executeSQL(ctx, sql, params?)` | Raw SQL (avoid in tests, use seeders)       |

### `tests/fixtures/seeders.ts`

| Function                        | Returns         | Description               |
| ------------------------------- | --------------- | ------------------------- |
| `seedUser(ctx, key)`            | `string` (uuid) | Creates user from fixture |
| `seedAccount(ctx, key, { userId })` | `string` (uuid) | Creates account           |
| `seedSession(ctx, key, { userId })` | `string` (uuid) | Creates session           |

## Testing Authenticated Routes

To test routes that require authentication, use the `createAuthSession` helper to create a valid session via Better Auth API.

### ⚠️ Important: Do NOT Seed Sessions Directly

**Direct database seeding of sessions does NOT work.** Better Auth uses **signed cookies** - the token must be cryptographically signed with `BETTER_AUTH_SECRET`. Tokens inserted directly into the database will not be recognized.

### Recommended Pattern: API-based Session Creation

Use the `createAuthSession` helper from `tests/helpers/auth.ts`:

```typescript
import { test, expect, FIXTURES } from '../fixtures'
import { createAuthSession, setAuthCookie } from '../helpers/auth'
import { resetDatabase } from '../helpers/db'

test('authenticated user can access protected route', async ({ page, context, appServer, dbContext }) => {
  await resetDatabase(dbContext)
  const baseUrl = `http://localhost:${appServer.port}`

  // Create session via Better Auth API (returns signed token)
  const { token } = await createAuthSession(baseUrl, {
    email: FIXTURES.users.testUser.email,
    password: 'password123',
  })

  // Set the signed cookie in browser context
  await setAuthCookie(context, token)

  // Navigate to protected route
  await page.goto('/protected')
  await expect(page.getByRole('heading', { name: /protected/i })).toBeVisible()
})
```

### Helper Functions

| Function | Description |
| -------- | ----------- |
| `createAuthSession(baseUrl, options)` | Creates user and session via `/api/auth/sign-up/email`, returns `{ token, userId }` |
| `setAuthCookie(context, token)` | Sets the `better-auth.session_token` cookie in browser context |

### Why This Works

1. `createAuthSession` calls Better Auth's signup endpoint
2. Better Auth creates the user, account, and session in the database
3. The response includes a `Set-Cookie` header with the **signed** session token
4. We extract that token and use it in `setAuthCookie`
5. The browser sends the properly signed cookie on subsequent requests

### Alternative: Full Signup Flow

For simpler tests, you can use the full UI signup flow:

```typescript
test('authenticated user can access protected route', async ({ page }) => {
  await page.goto('/auth/signup')
  await page.getByPlaceholder('you@email.com').fill('test@example.com')
  await page.getByPlaceholder('Minimum 8 characters').fill('password123')
  await page.getByPlaceholder('Repeat your password').fill('password123')
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.waitForURL('/')

  await page.goto('/protected')
  await expect(page.getByRole('heading', { name: /protected/i })).toBeVisible()
})
```

This is slower but doesn't require the `appServer` fixture.

## Troubleshooting

### "Cannot connect to Docker daemon"

Docker Desktop is not running. Start it and retry.

### Tests timeout on container start

First run downloads postgres:16 image (~150MB). Subsequent runs are faster.

### "relation does not exist"

Schema not created. The worker-scoped fixture applies all schemas automatically.

### Data leaking between tests

Check that `beforeEach` calls `resetDatabase(dbContext)`.

### Server not starting

Check that port 4000+ is available. Each worker uses port `4000 + workerIndex`. Kill orphan processes:

```bash
pkill -f "react-router dev"
```

### Health check timeout

The server starts but `/health/db` fails. This usually means:

- `DB_TEST_URL` is not being passed correctly
- The `pg` driver can't connect to TestContainers

Check `app/db/index.ts` - `DB_TEST_URL` must have priority over `DATABASE_URL`.

### Better Auth signOut returns 403 FORBIDDEN

**Symptom:** Logout button doesn't work. Browser console shows `403 FORBIDDEN` with `INVALID_ORIGIN` error.

**Cause:** Better Auth validates the `Origin` header for security. Test servers run on ports 4000-4003, which aren't in the default trusted origins.

**Solution:** Add test ports to `trustedOrigins` in `app/lib/auth.ts`:

```typescript
trustedOrigins: [
  'http://localhost:2025', // dev server
  'http://localhost:4000', // test worker 0
  'http://localhost:4001', // test worker 1
  'http://localhost:4002', // test worker 2
  'http://localhost:4003', // test worker 3
],
```

### Clicking overlay behind sidebar fails (element intercepts pointer events)

**Symptom:** Test tries to click an overlay to close a sidebar, but Playwright reports "element intercepts pointer events" and the click never happens.

**Cause:** The sidebar is positioned on top of the overlay. When clicking the overlay, the sidebar's nav or content intercepts the click.

**Solution:** Click on a specific position of the overlay that is not covered by the sidebar:

```typescript
// Sidebar is w-64 (256px), so click on the right side of the overlay
const overlay = page.locator('div.fixed.inset-0.bg-ink\\/50')
await overlay.click({ position: { x: 350, y: 300 } })
```

**Prevention:** When testing overlays that close sidebars/modals, always specify a click position outside the overlapping element.

---

### Session persists after signOut in E2E tests (cookie cache issue)

**Symptom:** In E2E tests, after clicking Logout and navigating to a protected route, the user is NOT redirected to login (session still appears valid).

**Cause:** Better Auth's `cookieCache` stores session data in a signed cookie. When `signOut` is called, the session is deleted from the database but the cache cookie persists for up to `maxAge` (configured as 5 minutes).

**Solution:** Clear cookies in tests after logout using `context.clearCookies()`:

```typescript
test('logged out user is redirected', async ({ page, context }) => {
  // ... login and do stuff ...

  // Logout and clear cookies to ensure session cache is cleared
  await page.getByRole('button', { name: /logout/i }).click()
  await page.waitForURL('/')
  await context.clearCookies()

  // Now navigation to protected route will correctly redirect to login
  await page.goto('/dashboard')
  await page.waitForURL('**/auth/login')
})
```

**IMPORTANT:** Do NOT disable `cookieCache` in `app/lib/auth.ts` as a workaround for tests. This would negatively impact production performance. Always use `context.clearCookies()` in tests instead.

**Reference:** https://github.com/better-auth/better-auth/issues/3743

## Rules (MUST FOLLOW)

1. **Import from `../fixtures`** - Never from `@playwright/test` directly
2. **Use semantic seeders** - No raw SQL in test files
3. **Use `dbContext` fixture** - Don't create containers manually
4. **Reset in `beforeEach`** - Never rely on test execution order
5. **Docker must be running** - Tests will fail otherwise
6. **Run with `--retries=1`** - As specified in AGENTS.md

## How It Works (Technical Details)

### Fixture Flow

```
1. Playwright starts worker
2. dbContext fixture:
   - Starts TestContainers PostgreSQL
   - Applies all schemas (users, accounts, sessions, verifications)
   - Returns DbContext with connectionString

3. appServer fixture (depends on dbContext):
   - Spawns `npx react-router dev --port 4000+workerIndex`
   - Passes DB_TEST_URL=connectionString to the process
   - Detects actual port from stdout (React Router may use different port if busy)
   - Waits for /health/db to respond OK
   - Returns { port, process }

4. baseURL fixture (depends on appServer):
   - Returns `http://localhost:${appServer.port}`

5. Tests run with { page, dbContext } available
   - page.goto() uses baseURL automatically
   - Seeds go to same DB the server uses

6. Cleanup:
   - Kills server process group
   - Stops TestContainers
```

### Why `DB_TEST_URL` Instead of `DATABASE_URL`?

Vite/React Router loads `.env.development` automatically, overwriting any `DATABASE_URL` we pass via `process.env`. Using a separate variable (`DB_TEST_URL`) that:

1. Isn't in any `.env` file
2. Has priority in `app/db/index.ts`
3. Points to the TestContainers database

This ensures the server connects to TestContainers during tests.
