# FEATURE 7.1 - Account Page

## ✅ IMPLEMENTATION STATUS: 100% COMPLETE

**Verificado en producción: Sin fallos ✅**

---

## 1. Natural Language Description

**Current State:**
- Users can log in with Google OAuth and access their dashboard
- User information (email, name, avatar) is stored in the database from Google
- There is no dedicated page to view account information
- Users cannot delete their account through the UI

**Expected End State:**
- Users have access to a dedicated `/dashboard/account` page
- The page displays read-only user information: email, name, avatar, and account creation date
- Users can see their premium status (free or premium badge)
- Users can copy their BioLink public URL (`https://biolinq.page/username`) to the clipboard
- Users can navigate back to the dashboard via a button
- Users can delete their account through a secure modal that requires typing their username to confirm
- When an account is deleted, all related data is removed from the database (cascade delete), and the user is signed out and redirected to the landing page
- The account page is accessible from the UserDropdown in the Header (same navigation available on all pages)

---

## 2. Technical Description

**Architecture:**
- Create a new route `/dashboard/account` that requires authentication
- Use the existing `Header` component (shared across home, dashboard, account)
- Use Base UI's `Dialog` component for the delete account confirmation modal
- Apply Soft Neo-Brutalism design system (matching the style of dashboard and other pages)
- Implement a new service `account.server.ts` to handle account deletion with proper cascade delete
- Update `UserDropdown` component to include a link to the account page

**Data Flow:**
- **Loader:** Fetch current user and biolink information (auth check + biolink lookup)
- **Action:** Handle "deleteAccount" intent by calling the account service, signing out, and redirecting
- **Component:** Display user info in a card layout, premium badge, copy button, and delete button with modal

**UI Components:**
- Use existing Neo-Brutal components: `NeoBrutalButton`, card patterns from style guide
- Create new `DeleteAccountDialog` component using Base UI Dialog with Neo-Brutal styling
- Display avatar using existing Google avatar URL pattern
- Use i18n for all user-facing text

**Dependencies:**
- Base UI Dialog component (`@base-ui/react/dialog`)
- Existing auth system (`~/lib/auth.server`, `~/lib/auth.client`)
- Existing username service (for fetching biolink)
- New account service (for deletion logic)

---

## 2.1. Architecture Gate

**Pages are puzzles:**
- Route module `/dashboard/account` composes:
  - `Header` (existing, shared component)
  - `AccountInfoCard` (new component: displays user info, premium badge, copy URL, back to dashboard)
  - `DeleteAccountDialog` (new component: Base UI Dialog with username confirmation input)
- Minimal JSX in route module; all UI logic is in components

**Loaders/actions are thin:**
- **Loader:** Parse request → call `getCurrentUser()` → call `getUserBiolink()` → return data
- **Action:** Parse request → check intent → call `deleteAccount()` → sign out → redirect to `/`
- No inline DB queries, no business logic in route

**Business logic is not in components:**
- Account deletion logic lives in `app/services/account.server.ts` (service layer)
  - `deleteAccount(userId: string)` handles cascade delete: daily_link_clicks → daily_stats → links → biolinks → sessions → accounts → user
- Components orchestrate UI state (modal open/closed, copy feedback) using hooks
- `AccountInfoCard` uses a custom hook `useCopyToClipboard` for copy button feedback
- `DeleteAccountDialog` uses a custom hook `useDeleteAccountForm` for form state and validation

---

## 3. Files to Change/Create

### `app/routes/dashboard.account.tsx`

**Objective:** Create the account page route that displays user information and allows account deletion. This is a new route that requires authentication and shares the same header/footer as dashboard and home.

**Pseudocode:**

```pseudocode
IMPORT getCurrentUser, getUserBiolink, deleteAccount, authClient
IMPORT AccountInfoCard, DeleteAccountDialog components
IMPORT Header (existing shared component)

LOADER FUNCTION
  INPUT: request
  PROCESS:
    - Call getCurrentUser(request)
    - IF no user OR no session → redirect to /auth/login
    - Call getUserBiolink(userId)
    - IF no biolink → redirect to / (homepage)
  OUTPUT:
    - user (id, email, name, image, isPremium, createdAt)
    - biolink (username, customDomain)
END LOADER

ACTION FUNCTION
  INPUT: request
  PROCESS:
    - Parse formData
    - Extract intent
    - IF intent === "deleteAccount":
      - Call getCurrentUser(request)
      - IF no user → redirect to /auth/login
      - Call deleteAccount(userId)
      - IF not success → return error
      - Call authClient.signOut() to invalidate session
      - Redirect to / (landing page)
  OUTPUT: redirect or error
END ACTION

COMPONENT AccountPage
  INPUT: loaderData { user, biolink }, actionData { error }
  RENDER:
    - Container (min-h-screen bg-neo-input/30)
      - Main content (max-w-3xl mx-auto px-4 py-8)
        - AccountInfoCard (user, biolink, onDelete triggers dialog)
        - DeleteAccountDialog (modal with username confirmation)
  OUTPUT: Rendered page
END COMPONENT
```

---

### `app/components/dashboard/AccountInfoCard.tsx`

**Objective:** Display user account information in a Neo-Brutal card with avatar, email, name, creation date, premium status, BioLink URL with copy button, and a link back to dashboard. This component does NOT contain the delete button (that's in DeleteAccountDialog).

**Pseudocode:**

```pseudocode
IMPORT useCopyToClipboard hook
IMPORT NeoBrutalButton
IMPORT useTranslation for i18n

COMPONENT AccountInfoCard
  PROPS: user { email, name, image, isPremium, createdAt }, biolink { username, customDomain }

  STATE:
    - copyFeedback: boolean (for showing "Copied!" feedback)

  HOOKS:
    - useCopyToClipboard() → { copyToClipboard, isCopied }
    - useTranslation() → { t }

  COMPUTED:
    - bioLinkUrl = customDomain ? `https://${customDomain}` : `https://biolinq.page/${username}`
    - formattedDate = format(createdAt, 'MMM d, yyyy') (use date-fns or Intl.DateTimeFormat)

  RENDER:
    - Neo-Brutal Card wrapper (bg-neo-panel, border-[3px] border-neo-dark, shadow-hard-lg)
      - Avatar section (top):
        - img (user.image, rounded-full, w-20 h-20, border-[3px] border-neo-dark)
      - Info section:
        - Email label + value (readonly)
        - Name label + value (readonly)
        - Created label + formattedDate
        - Premium status:
          IF isPremium: show "PREMIUM" badge (Neo-Brutal style)
          ELSE: show "FREE" text
      - BioLink URL section:
        - Label: "Your BioLink"
        - URL display (truncate if too long)
        - Copy button:
          - onClick: copyToClipboard(bioLinkUrl)
          - Show "Copied!" for 2 seconds if isCopied
      - Actions section:
        - Link to dashboard button (NeoBrutalButton variant=secondary, Link to="/dashboard")
  OUTPUT: Rendered card
END COMPONENT
```

---

### `app/components/dashboard/DeleteAccountDialog.tsx`

**Objective:** A Base UI Dialog component styled with Neo-Brutal design that requires the user to type their username to confirm account deletion. This component is triggered from the account page.

**Pseudocode:**

```pseudocode
IMPORT Dialog from '@base-ui/react/dialog'
IMPORT useDeleteAccountForm hook
IMPORT useTranslation for i18n
IMPORT Form from react-router

COMPONENT DeleteAccountDialog
  PROPS: username (expected input for confirmation), trigger (ReactNode for dialog trigger button)

  STATE:
    - isOpen: boolean (dialog open state)
    - inputValue: string (user's typed confirmation)

  HOOKS:
    - useDeleteAccountForm() → { inputValue, setInputValue, isValid, reset }
    - useTranslation() → { t }

  COMPUTED:
    - isValid = inputValue.trim().toLowerCase() === username.trim().toLowerCase()

  RENDER:
    - Dialog.Root (open={isOpen}, onOpenChange={setIsOpen})
      - Dialog.Trigger (renders trigger prop)
      - Dialog.Portal
        - Dialog.Backdrop (fixed inset-0, bg-black/50, Neo-Brutal overlay)
        - Dialog.Popup (Neo-Brutal card: bg-neo-panel, border-[3px] border-neo-dark, centered)
          - Dialog.Title: t('delete_account_title')
          - Dialog.Description: t('delete_account_description')
          - Form (method="post")
            - input type="hidden" name="intent" value="deleteAccount"
            - Label: t('delete_account_confirmation_label', { username })
            - Input (Neo-Brutal style):
              - value={inputValue}
              - onChange={setInputValue}
              - placeholder: t('delete_account_placeholder')
            - Actions:
              - Dialog.Close button (Cancel, NeoBrutalButton variant=secondary)
              - Submit button (Delete, NeoBrutalButton variant=destructive, disabled={!isValid})
  OUTPUT: Rendered dialog
END COMPONENT
```

---

### `app/services/account.server.ts`

**Objective:** Handle account deletion logic with proper cascade delete order to avoid foreign key constraint violations. This service ensures that all related data is removed before deleting the user record.

**Pseudocode:**

```pseudocode
IMPORT db, schema (users, biolinks, links, dailyStats, dailyLinkClicks, sessions, accounts)
IMPORT eq from drizzle-orm

EXPORT FUNCTION deleteAccount
  INPUT: userId (string)

  PROCESS:
    1. Fetch user's biolink:
       - Query biolinks WHERE userId = userId
       - IF no biolink found → RETURN { success: false, error: 'NO_BIOLINK' }

    2. Cascade delete in correct order:
       a. Delete daily_link_clicks for links belonging to this biolink:
          - Query links WHERE biolinkId = biolink.id
          - FOR EACH link:
            - DELETE daily_link_clicks WHERE linkId = link.id

       b. Delete daily_stats:
          - DELETE daily_stats WHERE biolinkId = biolink.id

       c. Delete links:
          - DELETE links WHERE biolinkId = biolink.id

       d. Delete biolink:
          - DELETE biolinks WHERE id = biolink.id

       e. Delete sessions:
          - DELETE sessions WHERE userId = userId

       f. Delete accounts:
          - DELETE accounts WHERE userId = userId

       g. Delete user:
          - DELETE users WHERE id = userId

    3. Release username (already handled by cascade delete)

  OUTPUT: { success: true } OR { success: false, error: string }
END FUNCTION
```

---

### `app/hooks/useCopyToClipboard.ts`

**Objective:** Custom hook to handle copy-to-clipboard functionality with feedback state. This is a reusable UI orchestration hook.

**Pseudocode:**

```pseudocode
IMPORT useState, useCallback from react

EXPORT FUNCTION useCopyToClipboard
  STATE:
    - isCopied: boolean (default: false)

  FUNCTION copyToClipboard
    INPUT: text (string)
    PROCESS:
      - TRY:
        - navigator.clipboard.writeText(text)
        - Set isCopied = true
        - setTimeout(() => { isCopied = false }, 2000)
      - CATCH error:
        - console.error(error)

  OUTPUT: { copyToClipboard, isCopied }
END FUNCTION
```

---

### `app/hooks/useDeleteAccountForm.ts`

**Objective:** Custom hook to manage the delete account form state and validation. This hook orchestrates the confirmation input and validation logic.

**Pseudocode:**

```pseudocode
IMPORT useState from react

EXPORT FUNCTION useDeleteAccountForm
  INPUT: expectedUsername (string)

  STATE:
    - inputValue: string (default: "")

  COMPUTED:
    - isValid = inputValue.trim().toLowerCase() === expectedUsername.trim().toLowerCase()

  FUNCTION setInputValue
    INPUT: value (string)
    PROCESS: Update inputValue state

  FUNCTION reset
    PROCESS: Set inputValue = ""

  OUTPUT: { inputValue, setInputValue, isValid, reset }
END FUNCTION
```

---

### `app/components/UserDropdown.tsx`

**Objective:** Update the existing UserDropdown component to include a link to the account page. This requires adding a new menu item in the dropdown.

**Pseudocode:**

```pseudocode
EXISTING COMPONENT UserDropdown
  PROPS: user, onLogout

  MODIFICATION:
    - Find the menu items section
    - ADD new menu item BEFORE logout:
      - Link to="/dashboard/account"
      - Icon: User icon or Account icon
      - Text: t('account_page_link') → "Account"

  RENDER:
    - (existing dropdown structure)
    - Menu items:
      1. Dashboard (IF not already on dashboard)
      2. **Account** (NEW - link to /dashboard/account)
      3. Logout (existing)
END COMPONENT
```

---

### `app/routes.ts`

**Objective:** Register the new `/dashboard/account` route in the routing configuration.

**Pseudocode:**

```pseudocode
EXISTING FILE app/routes.ts

MODIFICATION:
  - ADD new route entry:
    route('dashboard/account', 'routes/dashboard.account.tsx')

  - Insert AFTER the existing 'dashboard' route
END MODIFICATION
```

---

## 4. I18N Section

### Existing keys to reuse
- `login_title` - Para el header (si aplica)
- `cancel` - Para el botón Cancel en el modal
- `loading` - Para estados de carga (si aplica)

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `account_page_title` | Account | Cuenta |
| `account_page_link` | Account | Cuenta |
| `account_info_email` | Email | Email |
| `account_info_name` | Name | Nombre |
| `account_info_created` | Member since | Miembro desde |
| `account_info_premium_status` | Account Type | Tipo de cuenta |
| `account_info_free` | Free | Gratis |
| `account_info_premium_badge` | PREMIUM | PREMIUM |
| `account_biolink_label` | Your BioLink | Tu BioLink |
| `account_copy_url` | Copy URL | Copiar URL |
| `account_copy_url_copied` | Copied! | ¡Copiado! |
| `account_back_to_dashboard` | Back to Dashboard | Volver al Dashboard |
| `account_delete_button` | Delete Account | Eliminar Cuenta |
| `delete_account_title` | Delete Account? | ¿Eliminar cuenta? |
| `delete_account_description` | This action cannot be undone. All your data, links, and stats will be permanently deleted. | Esta acción no se puede deshacer. Todos tus datos, links y estadísticas se eliminarán permanentemente. |
| `delete_account_confirmation_label` | To confirm, type your username: <strong>{{username}}</strong> | Para confirmar, escribe tu nombre de usuario: <strong>{{username}}</strong> |
| `delete_account_placeholder` | Type your username | Escribe tu nombre de usuario |
| `delete_account_confirm_button` | Delete My Account | Eliminar Mi Cuenta |

---

## 5. E2E Test Plan

### Test: User can view account information
- **Preconditions:** User is logged in and has a biolink
- **Steps:**
  1. Navigate to `/dashboard`
  2. Click on user dropdown in header
  3. Click on "Account" link
  4. Verify redirect to `/dashboard/account`
  5. Verify page displays:
     - User avatar
     - User email
     - User name
     - Account creation date
     - Premium status badge (FREE or PREMIUM)
     - BioLink URL
     - Copy URL button
     - Back to Dashboard button
     - Delete Account button
- **Expected:** All user information is displayed correctly and matches the user's data

---

### Test: User can copy BioLink URL to clipboard
- **Preconditions:** User is on `/dashboard/account`
- **Steps:**
  1. Click "Copy URL" button
  2. Verify button text changes to "Copied!" for 2 seconds
  3. Verify clipboard contains `https://biolinq.page/{username}`
- **Expected:** URL is copied to clipboard and user receives visual feedback

---

### Test: User can copy custom domain URL if configured (Premium)
- **Preconditions:** Premium user with custom domain configured on `/dashboard/account`
- **Steps:**
  1. Click "Copy URL" button
  2. Verify clipboard contains custom domain URL (e.g., `https://links.example.com`)
- **Expected:** Custom domain URL is copied instead of biolinq.page URL

---

### Test: User can navigate back to dashboard
- **Preconditions:** User is on `/dashboard/account`
- **Steps:**
  1. Click "Back to Dashboard" button
  2. Verify redirect to `/dashboard`
- **Expected:** User is redirected to dashboard page

---

### Test: Delete account modal opens and requires username confirmation
- **Preconditions:** User is on `/dashboard/account`
- **Steps:**
  1. Click "Delete Account" button
  2. Verify modal opens with:
     - Title "Delete Account?"
     - Warning message
     - Input field for username
     - Cancel button
     - Delete button (disabled by default)
  3. Type incorrect username
  4. Verify "Delete" button remains disabled
  5. Type correct username (matching user's username)
  6. Verify "Delete" button becomes enabled
- **Expected:** Modal requires exact username match to enable deletion

---

### Test: User can cancel account deletion
- **Preconditions:** User has opened delete account modal
- **Steps:**
  1. Click "Cancel" button or click outside modal
  2. Verify modal closes
  3. Verify user remains on `/dashboard/account`
  4. Verify no data was deleted (user can still access dashboard)
- **Expected:** Account deletion is cancelled and no changes are made

---

### Test: User can delete account with confirmation
- **Preconditions:** User is on `/dashboard/account`, username is "testuser"
- **Steps:**
  1. Click "Delete Account" button
  2. Type "testuser" in confirmation input
  3. Click "Delete My Account" button
  4. Verify user is signed out
  5. Verify redirect to `/` (landing page)
  6. Try to log in again with same credentials
  7. Verify user can log in (Google OAuth creates new account)
  8. Verify old biolink data is gone (username is available again)
- **Expected:** Account and all related data are deleted, user is signed out, and username is released for re-registration

---

### Test: Account page is only accessible to authenticated users
- **Preconditions:** User is not logged in
- **Steps:**
  1. Navigate directly to `/dashboard/account`
  2. Verify redirect to `/auth/login`
- **Expected:** Unauthenticated users cannot access account page

---

### Test: Account deletion cascade deletes all related data
- **Preconditions:** User has biolink with links, views, clicks, and daily stats
- **Steps:**
  1. Navigate to `/dashboard/account`
  2. Delete account (with confirmation)
  3. Verify database cleanup (in test context):
     - `daily_link_clicks` records deleted
     - `daily_stats` records deleted
     - `links` records deleted
     - `biolinks` record deleted
     - `sessions` records deleted
     - `accounts` records deleted
     - `users` record deleted
- **Expected:** All related data is properly cascade deleted without foreign key violations

---

### Test: Premium badge displays correctly for premium users
- **Preconditions:** User is premium (isPremium = true)
- **Steps:**
  1. Navigate to `/dashboard/account`
  2. Verify "PREMIUM" badge is displayed with Neo-Brutal styling
  3. Verify badge uses correct colors (bg-neo-dark, text-neo-primary)
- **Expected:** Premium users see the premium badge correctly styled

---

### Test: Free users see correct account type
- **Preconditions:** User is not premium (isPremium = false)
- **Steps:**
  1. Navigate to `/dashboard/account`
  2. Verify "FREE" text is displayed (not a badge)
- **Expected:** Free users see "FREE" as their account type

---
