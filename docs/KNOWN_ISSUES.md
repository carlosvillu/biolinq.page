# Known Issues & Lessons Learned

This document captures lessons learned from bugfixes to prevent repeating the same mistakes.

---

## Testing

### OAuth Provider Testing Limitations

**Date:** 2024-12-10

**Problem:** It's not practical to write automated E2E tests for OAuth flows with external providers (Google, GitHub, etc.)

**Root Cause:** OAuth flows require:
- Redirection to external domains (accounts.google.com)
- Interaction with third-party UI that may change
- Tokens and states that expire
- OAuth app configuration in test mode

**Solution:** For OAuth-related bugs:
1. Verify the flow manually
2. Test only what we control (parameters sent, configuration)
3. Document manual testing required in bugfix notes

**Prevention:**
- Don't attempt to simulate complete OAuth flows in E2E
- Use Playwright interceptors only to verify correct parameters are sent
- Accept that some flows require manual testing

---

## UI / Architecture

### Route modules degenerate into "god components" (UI + handlers + DB)

**Date:** 2025-12-13

**Problem:** Over time, route modules tend to accumulate large JSX, handlers, error mapping, and sometimes inline DB queries. This makes code hard to maintain and breaks separation of concerns.

**Root Cause:**
- It's fast to implement changes "directly in the route"
- Loader/action/component are in the same file and boundaries blur
- Without explicit guardrails, UI and logic get mixed

**Solution:** Apply strict architecture:
- Route modules as "puzzles": minimal composition
- React orchestration (state, handlers, server->form mapping) in `app/hooks/*`
- Domain rules and DB in `app/services/*`
- Pure shared helpers in `app/lib/*`

**Prevention:**
- If a route module starts having large JSX, extract visual blocks to `app/components/*` by copying JSX literally
- Loaders/actions only parse `request`, decide `intent`, call services and return data/redirect
- Never inline Drizzle/DB queries in loaders/actions
- Don't call hooks conditionally: if there are early returns, build defaults or separate components

---

### Better Auth Session Seeding in Tests

**Date:** 2024-12-11

**Problem:** Seeding sessions directly in the database and setting cookies manually doesn't work. Better Auth doesn't recognize seeded sessions.

**Root Cause:** Better Auth uses **signed cookies** (`getSignedCookie`). The token in the `better-auth.session_token` cookie must be cryptographically signed with `BETTER_AUTH_SECRET`. Tokens inserted directly into DB don't have this signature.

**Solution:** Use Better Auth's HTTP API to create valid sessions:

```typescript
import { createAuthSession, setAuthCookie } from '../helpers/auth'

const { token } = await createAuthSession(baseUrl, {
  email: 'test@example.com',
  password: 'password123',
})
await setAuthCookie(context, token)
```

**Prevention:**
- Use `createAuthSession` helper from `tests/helpers/auth.ts` to create sessions in tests
- Alternatively, use the full signup flow in the browser
- **NEVER** seed sessions directly in DB and expect them to work with manual cookies

---

## UI / State Management

### React Router can revalidate without remount (stale local state)

**Date:** 2025-12-23

**Problem:** In routes where only `search` changes (e.g., removing `?conv=` after deleting a conversation), React Router may revalidate the loader without unmounting the React tree. If the component maintains state locally, old data may remain visible even though the loader returns fresh data.

**Root Cause:** Revalidation/navigation within the same route module without a remount of the subtree that contains the state.

**Solution:** Force a deterministic reset with a remount using `key` on the subtree derived from the conversation identifier (e.g., `key={activeConversationId ?? 'no-conversation'}`) and ensure the hook that maintains state lives inside that subtree.

**Prevention:** When a feature depends on `search`/params changes resetting local state (chat, complex forms), prefer `keyed remount` instead of `useEffect`-based resets.

---

## Mobile Responsive Design

### Mobile Overflow in Dashboard Grids

**Date:** 2025-12-12

**Problem:** In dashboard layouts, some grids with cards produced invisible horizontal scroll on mobile.

**Root Cause:**
- Main container with `max-w-7xl` without `w-full` or `overflow-hidden`
- Grids relying only on `lg:grid-cols-3` without forcing `grid-cols-1` on mobile
- Cards inside grid without `min-w-0`, preventing them from shrinking correctly

**Solution:**
1. In page wrapper, use `w-full max-w-7xl mx-auto overflow-hidden`
2. In content grids, use `grid grid-cols-1 gap-8 lg:grid-cols-3` to force 1 column on mobile
3. Add `min-w-0` to cards (`<Card className="... min-w-0">`) inside the grid

**Prevention:**
- For any new grid in dashboard, always start with `grid-cols-1` and add extra columns only in larger breakpoints
- When a card goes inside a grid, systematically add `min-w-0`
- When creating new dashboard layouts, explicitly test on mobile viewports (320–400px) and check `scrollWidth` vs `innerWidth`
