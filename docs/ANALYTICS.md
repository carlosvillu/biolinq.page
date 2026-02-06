# Analytics Documentation

## Overview

BioLinq uses Google Analytics 4 (GA4) for tracking user interactions and site metrics. The analytics system is designed to be:

- **Type-safe:** All events are typed with TypeScript
- **No-op safe:** Functions gracefully handle missing `gtag` (SSR, blocked scripts)
- **Cross-cutting:** Implemented as a hook for React components

## Architecture

```
app/lib/analytics-events.ts      → Core event functions (framework-agnostic)
app/hooks/useAnalytics.ts        → React hook wrapper for components
app/lib/gtag.client.ts           → GA4 initialization and pageview tracking
app/lib/hash.server.ts           → SHA-256 hash for user_id (server-only)
app/hooks/usePageviewTracking.ts → Automatic pageview tracking hook
app/hooks/useUpgradeTracking.ts  → Purchase event on Stripe redirect
app/components/GoogleAnalytics.tsx → Script injection component (includes user_id)
```

## Files

### `app/lib/analytics-events.ts`

Core module with all typed GA4 event functions. Each function:
- Checks if `window.gtag` exists before calling
- Returns silently (no-op) if gtag is unavailable
- Uses the standard `gtag('event', eventName, params)` pattern

### `app/hooks/useAnalytics.ts`

React hook that exposes all tracking functions. Components should use this hook:

```tsx
import { useAnalytics } from '~/hooks/useAnalytics'

function MyComponent() {
  const { trackLinkAdded, trackThemeChanged } = useAnalytics()
  
  const handleAddLink = () => {
    // ... add link logic
    trackLinkAdded()
  }
}
```

### `app/lib/gtag.client.ts`

Handles GA4 initialization and pageview tracking. Declares the global `Window.gtag` type.

### `app/hooks/usePageviewTracking.ts`

Automatic pageview tracking on route changes. Also sets the `language` user property.

### `app/hooks/useUpgradeTracking.ts`

Detects `?upgrade=success&session_id=X` in URL after Stripe redirect, fires `purchase` event, and cleans the URL params. Used in `dashboard.tsx`.

### `app/lib/hash.server.ts`

Server-only utility to hash user IDs with SHA-256 (truncated to 16 chars) for GA4 `user_id` tracking without exposing real UUIDs.

## Available Events

### Auth Events

| Function | Event Name | Parameters | When to Use |
|----------|------------|------------|-------------|
| `trackSignup()` | `sign_up` | `{ method: 'google' }` | Before OAuth redirect for new users |

### Username Events

| Function | Event Name | Parameters | When to Use |
|----------|------------|------------|-------------|
| `trackUsernameCreated(username)` | `username_created` | `{ username }` | After successful username claim |

### Link Events

| Function | Event Name | Parameters | When to Use |
|----------|------------|------------|-------------|
| `trackLinkAdded()` | `link_added` | - | After successfully adding a link |
| `trackLinkDeleted()` | `link_deleted` | - | When deleting a link |
| `trackLinkClicked(linkId, position)` | `link_clicked` | `{ link_id, position }` | On public page link click |
| `trackLinksReordered()` | `links_reordered` | - | When saving reordered links |

### Theme Events

| Function | Event Name | Parameters | When to Use |
|----------|------------|------------|-------------|
| `trackThemeChanged(theme)` | `theme_changed` | `{ theme }` | When user selects a theme |
| `trackThemeColorsChanged()` | `theme_colors_changed` | - | When saving custom colors |

### Premium Events

| Function | Event Name | Parameters | When to Use |
|----------|------------|------------|-------------|
| `trackPremiumCTAClicked(location)` | `premium_cta_clicked` | `{ location }` | On premium upgrade CTA click |

Locations: `'dashboard_banner'`, `'landing_pricing'`

### Ecommerce Events (GA4 Standard)

| Function | Event Name | Parameters | When to Use |
|----------|------------|------------|-------------|
| `trackBeginCheckout()` | `begin_checkout` | `{ currency, value, items }` | When user clicks "Go Premium" |
| `trackPurchase(transactionId)` | `purchase` | `{ transaction_id, currency, value, items }` | On successful Stripe redirect |

These events follow GA4's standard ecommerce schema and appear in GA4's Monetization reports.

**Ecommerce data:**
- `currency`: `'EUR'`
- `value`: `5.00`
- `items`: `[{ item_name: 'BioLinq Premium', price: 5.00, quantity: 1 }]`

### Blog Events

| Function | Event Name | Parameters | When to Use |
|----------|------------|------------|-------------|
| `trackBlogPostViewed(slug, tags)` | `blog_post_viewed` | `{ slug, tags }` | On blog post page view |
| `trackBlogCTAClicked(location)` | `blog_cta_clicked` | `{ location }` | On internal CTA link click in blog |

### Profile Events

| Function | Event Name | Parameters | When to Use |
|----------|------------|------------|-------------|
| `trackProfileViewed(username)` | `profile_viewed` | `{ username }` | On public profile page view |

### Custom Domain Events

| Function | Event Name | Parameters | When to Use |
|----------|------------|------------|-------------|
| `trackCustomDomainSet(domain)` | `custom_domain_set` | `{ domain }` | After setting custom domain |
| `trackCustomDomainVerified(step)` | `custom_domain_verified` | `{ step }` | After verification success |
| `trackCustomDomainRemoved()` | `custom_domain_removed` | - | When removing custom domain |

Steps: `'ownership'`, `'cname'`

### Language Events

| Function | Event Name | Parameters | When to Use |
|----------|------------|------------|-------------|
| `trackLanguageChanged(language)` | `language_changed` | `{ language }` | When user changes language |
| `setLanguageProperty(language)` | (user property) | `{ language }` | On each pageview |

## Adding a New Event

### Step 1: Add the function to `app/lib/analytics-events.ts`

```ts
export function trackMyNewEvent(param1: string, param2: number): void {
  gtagEvent('my_new_event', { param1, param2 })
}
```

### Step 2: Export from `app/hooks/useAnalytics.ts`

```ts
import {
  // ... existing imports
  trackMyNewEvent,
} from '~/lib/analytics-events'

export function useAnalytics() {
  return {
    // ... existing functions
    trackMyNewEvent,
  }
}
```

### Step 3: Use in your component

```tsx
const { trackMyNewEvent } = useAnalytics()

// In your handler:
trackMyNewEvent('value1', 42)
```

## Best Practices

1. **Track at the right moment:** Fire events after the action succeeds, not before
2. **Use meaningful names:** Event names should be `snake_case` and descriptive
3. **Keep parameters minimal:** Only include data needed for analysis
4. **No PII:** Never include email, full name, or other personally identifiable information
5. **Test in GA4 Real-Time:** Verify events appear in GA4 Real-Time reports during development
6. **Ecommerce events:** Use GA4 standard event names (`begin_checkout`, `purchase`) for Monetization reports

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GA_MEASUREMENT_ID` | GA4 Measurement ID (G-XXXXXXXXXX) | Yes (production) |

GA4 only loads when `GA_MEASUREMENT_ID` is set. In development, events are no-ops.

## Verification

To verify tracking is working:

1. Open GA4 Real-Time reports
2. Perform the action in the app
3. Check that the event appears with correct parameters

## Integration Points

Events are integrated in these files:

- `app/hooks/useUsernameClaim.ts` - signup, username created
- `app/hooks/useLinksReorder.ts` - links reordered
- `app/components/dashboard/AddLinkDialog.tsx` - link added
- `app/components/dashboard/DeleteLinkDialog.tsx` - link deleted
- `app/components/dashboard/ThemeSelector.tsx` - theme changed
- `app/components/dashboard/CustomizationSection.tsx` - colors changed
- `app/components/dashboard/PremiumBanner.tsx` - premium CTA, begin_checkout (dashboard)
- `app/components/dashboard/CustomDomainSection.tsx` - custom domain flow
- `app/components/public/PublicLinkCard.tsx` - link clicked
- `app/components/public/PublicProfile.tsx` - profile viewed (via usePageView)
- `app/components/blog/BlogPostLayout.tsx` - blog post viewed, blog CTA clicked (in-content links)
- `app/components/blog/RelatedPosts.tsx` - blog CTA clicked (footer CTA)
- `app/components/LanguageSelector.tsx` - language changed
- `app/components/landing/PricingSection.tsx` - premium CTA (landing)
- `app/hooks/usePageviewTracking.ts` - language property
- `app/hooks/usePageView.ts` - profile viewed
- `app/hooks/useUpgradeTracking.ts` - purchase event on Stripe success redirect
- `app/routes/dashboard.tsx` - calls useUpgradeTracking hook
- `app/root.tsx` - passes hashedUserId to GoogleAnalytics
- `app/components/GoogleAnalytics.tsx` - sets user_id in gtag config

## User ID Tracking

For cross-device tracking, authenticated users have a hashed `user_id` set in GA4:

1. `app/lib/hash.server.ts` generates a SHA-256 hash (16 chars) of the user's UUID
2. `app/root.tsx` loader computes `hashedUserId` for authenticated users
3. `app/components/GoogleAnalytics.tsx` includes `user_id` in the gtag config

This allows GA4 to correlate sessions across devices without exposing real user IDs.

## Stripe Ecommerce Flow

1. User clicks "Go Premium" → `trackPremiumCTAClicked()` + `trackBeginCheckout()` fire
2. User completes Stripe checkout
3. Stripe redirects to `/dashboard?upgrade=success&session_id={CHECKOUT_SESSION_ID}`
4. `useUpgradeTracking` hook detects params, fires `trackPurchase(sessionId)`, cleans URL
5. Events appear in GA4 Monetization reports
