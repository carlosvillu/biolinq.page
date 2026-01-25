# FEATURE_9.4_DASHBOARD_TRACKING.md

## ✅ IMPLEMENTATION STATUS: 100% COMPLETE

**Verificado en producción: Sin fallos ✅**

---

## 1. Natural Language Description

### Current State
- GA4 tracking exists for custom events (link actions, theme changes, ecommerce)
- Pageview tracking happens via `usePageviewTracking` in `root.tsx`
- User properties currently tracked: `language`, `environment`
- No user properties for `user_type`, `has_biolink`, or `link_count`
- No specific events for account page visits or delete account flow

### Expected End State
- Dashboard pageviews (`/dashboard`) include user properties: `user_type`, `has_biolink`, `link_count`
- Account page visits (`/dashboard/account`) tracked with same user properties
- Delete account flow tracked: `delete_account_started` (modal opened) and `account_deleted` (confirmed)
- User properties updated on every pageview in authenticated areas
- No PII sent to GA (no email, no full name)

---

## 2. Technical Description

### High-Level Approach
1. **Create new user property setter functions** in `analytics-events.ts` to set `user_type`, `has_biolink`, and `link_count` via `gtag('set', 'user_properties', {...})`
2. **Create a new hook `useUserPropertiesTracking`** that receives user data from the loader and sets the user properties on mount/change
3. **Add delete account tracking events** (`trackDeleteAccountStarted`, `trackAccountDeleted`) to `analytics-events.ts`
4. **Integrate the hooks** in dashboard and account pages
5. **Add tracking calls** in the `DeleteAccountDialog` component for the started event and in the action/form submission for the completed event

### Architecture Decisions
- User properties are set on each pageview in dashboard/account (per user decision)
- The hook will use data passed from the page's loader (already available)
- Tracking is client-side only (no server-side GA calls)
- Delete account events: started fires on modal open, completed fires before form submit (since page will navigate away)

### No PII Compliance
- `user_type`: "free" | "premium" (derived from `isPremium` boolean)
- `has_biolink`: true | false (boolean, no username)
- `link_count`: number (just the count, no link data)
- No email, name, or other identifiable info sent

---

## 2.1. Architecture Gate

- **Pages are puzzles:** Route modules (`dashboard.tsx`, `dashboard.account.tsx`) compose components and pass loader data. No business logic in routes.
- **Loaders/actions are thin:** Loaders already fetch user data (`isPremium`, `biolink`, `links`). No changes to loaders needed.
- **Business logic is not in components:**
  - User property computation (`user_type` from `isPremium`, `link_count` from `links.length`) happens in the hook, not in the component JSX.
  - Tracking functions remain in `app/lib/analytics-events.ts`.
  - Hook orchestration in `app/hooks/useUserPropertiesTracking.ts`.
  - Components only call hooks and render.

### Route Module Summary
- **`dashboard.tsx`**: Calls existing services in loader. Uses `useUserPropertiesTracking(user, biolink, links)`.
- **`dashboard.account.tsx`**: Calls existing services in loader. Uses `useUserPropertiesTracking(user, biolink, null)`.

### Component Summary
- **`DeleteAccountDialog.tsx`**: Uses `useAnalytics()` to get `trackDeleteAccountStarted`. Calls it when modal opens. Calls `trackAccountDeleted` on form submit (before navigation).

---

## 3. Files to Change/Create

### `app/lib/analytics-events.ts`
**Objective:** Add new event functions for user properties and delete account tracking

**Pseudocode:**
```pseudocode
// New user property setters
FUNCTION setUserTypeProperty(userType: 'free' | 'premium')
  IF gtag not available THEN return
  gtag('set', 'user_properties', { user_type: userType })
END

FUNCTION setHasBiolinkProperty(hasBiolink: boolean)
  IF gtag not available THEN return
  gtag('set', 'user_properties', { has_biolink: hasBiolink })
END

FUNCTION setLinkCountProperty(linkCount: number)
  IF gtag not available THEN return
  gtag('set', 'user_properties', { link_count: linkCount })
END

// Delete account events
FUNCTION trackDeleteAccountStarted()
  gtagEvent('delete_account_started')
END

FUNCTION trackAccountDeleted()
  gtagEvent('account_deleted')
END
```

---

### `app/hooks/useAnalytics.ts`
**Objective:** Export the new tracking functions

**Pseudocode:**
```pseudocode
IMPORT all new functions from analytics-events.ts
  - setUserTypeProperty
  - setHasBiolinkProperty
  - setLinkCountProperty
  - trackDeleteAccountStarted
  - trackAccountDeleted

FUNCTION useAnalytics()
  RETURN object with all existing + new functions
END
```

---

### `app/hooks/useUserPropertiesTracking.ts` (NEW FILE)
**Objective:** Hook that sets GA4 user properties based on user state. Called on authenticated pages.

**Pseudocode:**
```pseudocode
IMPORT useEffect from react
IMPORT setUserTypeProperty, setHasBiolinkProperty, setLinkCountProperty from analytics-events

INTERFACE UserPropertiesData
  isPremium: boolean
  hasBiolink: boolean
  linkCount: number | null  // null means we don't have this data (e.g., account page)

FUNCTION useUserPropertiesTracking(data: UserPropertiesData)
  useEffect(() => {
    // Set user type
    userType = data.isPremium ? 'premium' : 'free'
    setUserTypeProperty(userType)

    // Set has_biolink
    setHasBiolinkProperty(data.hasBiolink)

    // Set link_count only if available
    IF data.linkCount !== null THEN
      setLinkCountProperty(data.linkCount)
    END
  }, [data.isPremium, data.hasBiolink, data.linkCount])
END

EXPORT useUserPropertiesTracking
```

---

### `app/routes/dashboard.tsx`
**Objective:** Integrate user properties tracking

**Pseudocode:**
```pseudocode
// In imports section
IMPORT useUserPropertiesTracking from ~/hooks/useUserPropertiesTracking

// In component, after useLoaderData
FUNCTION DashboardPage()
  { user, biolink, links, stats } = useLoaderData()

  // Add user properties tracking (after useUpgradeTracking)
  useUserPropertiesTracking({
    isPremium: user.isPremium,
    hasBiolink: true,  // Always true if they're on dashboard (loader redirects otherwise)
    linkCount: links.length
  })

  // ... rest of component unchanged
END
```

---

### `app/routes/dashboard.account.tsx`
**Objective:** Integrate user properties tracking

**Pseudocode:**
```pseudocode
// In imports section
IMPORT useUserPropertiesTracking from ~/hooks/useUserPropertiesTracking

// In component, after useLoaderData
FUNCTION AccountPage()
  { accountUser, biolink } = useLoaderData()

  // Add user properties tracking
  useUserPropertiesTracking({
    isPremium: accountUser.isPremium,
    hasBiolink: true,  // Always true if they're on account page (loader redirects otherwise)
    linkCount: null    // Account page doesn't have link data
  })

  // ... rest of component unchanged
END
```

---

### `app/components/dashboard/DeleteAccountDialog.tsx`
**Objective:** Add tracking for delete account flow (started and completed)

**Pseudocode:**
```pseudocode
// In imports section
IMPORT useAnalytics from ~/hooks/useAnalytics

// In component
FUNCTION DeleteAccountDialog({ username })
  { t } = useTranslation()
  [isOpen, setIsOpen] = useState(false)
  { inputValue, setInputValue, isValid, reset } = useDeleteAccountForm(username)
  { trackDeleteAccountStarted, trackAccountDeleted } = useAnalytics()

  // Track when modal opens
  handleOpenChange = (open: boolean) => {
    IF open THEN
      trackDeleteAccountStarted()
    END
    setIsOpen(open)
    IF !open THEN
      reset()
    END
  }

  // Track when form is submitted (before navigation happens)
  handleSubmit = (e: FormEvent) => {
    IF isValid THEN
      trackAccountDeleted()
    END
    // Let form submit naturally (no preventDefault)
  }

  RETURN (
    // ... existing JSX
    // Add onSubmit={handleSubmit} to Form element
    <Form method="post" onSubmit={handleSubmit} className="space-y-6">
    // ... rest unchanged
  )
END
```

---

## 4. I18N Section

No new i18n keys required. This task only adds analytics tracking, no user-facing text changes.

---

## 5. E2E Test Plan

### Test: Dashboard pageview sets user properties for free user

**Preconditions:**
- User is logged in with a free account
- User has a biolink with 2 links

**Steps:**
1. Navigate to `/dashboard`
2. Wait for page load
3. Check `window.dataLayer` for user properties

**Expected:**
- dataLayer contains entry with `user_type: 'free'`
- dataLayer contains entry with `has_biolink: true`
- dataLayer contains entry with `link_count: 2`

---

### Test: Dashboard pageview sets user properties for premium user

**Preconditions:**
- User is logged in with a premium account
- User has a biolink with 3 links

**Steps:**
1. Navigate to `/dashboard`
2. Wait for page load
3. Check `window.dataLayer` for user properties

**Expected:**
- dataLayer contains entry with `user_type: 'premium'`
- dataLayer contains entry with `has_biolink: true`
- dataLayer contains entry with `link_count: 3`

---

### Test: Account page sets user properties (without link_count)

**Preconditions:**
- User is logged in with a free account

**Steps:**
1. Navigate to `/dashboard/account`
2. Wait for page load
3. Check `window.dataLayer` for user properties

**Expected:**
- dataLayer contains entry with `user_type: 'free'`
- dataLayer contains entry with `has_biolink: true`
- No entry for `link_count` (since account page doesn't pass it)

---

### Test: Delete account started event fires when modal opens

**Preconditions:**
- User is logged in
- User is on `/dashboard/account`

**Steps:**
1. Click "Delete Account" button
2. Wait for modal to appear
3. Check `window.dataLayer` for event

**Expected:**
- dataLayer contains entry with event name `delete_account_started`

---

### Test: Delete account completed event fires on form submit

**Preconditions:**
- User is logged in
- User is on `/dashboard/account`
- Delete modal is open
- User has typed their username correctly

**Steps:**
1. Type the username in the confirmation input
2. Capture dataLayer before submission using `page.exposeFunction()`
3. Click "Delete Account" confirmation button

**Expected:**
- `account_deleted` event was pushed to dataLayer before navigation

**Note:** This test requires special handling because the form submission causes navigation. Use `page.exposeFunction()` to capture events before navigation, as documented in `docs/KNOWN_ISSUES.md`.

---

### Test: No PII in tracked data

**Preconditions:**
- User is logged in

**Steps:**
1. Navigate to `/dashboard`
2. Capture all dataLayer entries
3. Inspect all entries for PII

**Expected:**
- No entry contains user email
- No entry contains user full name
- No entry contains username (except where explicitly needed like `username_created`)
- Only contains: `user_type`, `has_biolink`, `link_count`, `language`, `environment`

---

## Implementation Notes

1. **User properties vs events:** GA4 user properties persist across sessions and are used for segmentation. They should be set on each pageview to ensure GA4 has the latest values.

2. **dataLayer inspection in tests:** Remember to use `Array.from()` when inspecting dataLayer entries, as per `KNOWN_ISSUES.md`.

3. **Navigation during form submit:** The `account_deleted` event must fire synchronously before form submission to ensure it's captured before the page navigates away.

4. **Link count on account page:** The account page loader doesn't fetch links, so `linkCount` will be `null`. The hook handles this by not setting the property when null.
