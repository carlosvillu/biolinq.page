# FEATURE_11.6_cookies_route_footer_update.md

## 1. Natural Language Description

**Current State:**
- Footer links include "Terms" and "Privacy" pointing to `/terms` and `/privacy`
- Cookie Policy content exists in `content/legal/en/cookies.md` and `content/legal/es/cookies.md`
- No route exists for `/cookies` - would result in 404
- Footer does not include a link to the Cookies page

**Expected End State:**
- New `/cookies` route exists and renders the Cookie Policy using the same pattern as `/terms` and `/privacy`
- Footer includes a third link "Cookies" between "Privacy" and the copyright text
- Cookie Policy page changes language correctly when user switches language via LanguageSelector
- All three legal pages (Terms, Privacy, Cookies) work consistently with i18n

---

## 2. Technical Description

This task creates the missing `/cookies` route and updates the Footer to include a link to it. The implementation follows the exact same pattern already established in Tasks 11.4 and 11.5 for the Terms and Privacy pages.

**Architecture:**
- Route module loads Markdown content from `content/legal/{locale}/cookies.md`
- Uses `getLegalContent()` service (already exists)
- Renders with `LegalPageLayout` component (already exists)
- Footer gets a new `Link` element and uses a new i18n key `footer_cookies`

**No new services or components needed** - everything reuses existing infrastructure.

---

## 2.1. Architecture Gate

✅ **Pages are puzzles:**
- `legal.cookies.tsx` route module will compose `LegalPageLayout` component with minimal UI (just the loader data)
- No custom UI elements in the route module itself

✅ **Loaders/actions are thin:**
- Loader parses `request` to detect locale via cookie/Accept-Language
- Calls `getLegalContent('cookies', locale)` service
- Returns structured data (`html`, `title`, `description`)
- No business logic inline

✅ **Business logic is not in components:**
- Locale detection: `detectLocale()` in `app/lib/i18n.ts`
- Content loading: `getLegalContent()` in `app/services/legal-content.server.ts`
- Rendering: `LegalPageLayout` component (presentational)

**For Footer update:**
- Footer is a presentational component - it only renders links
- No business logic added, just a new static link
- Uses i18n for the label

---

## 3. Files to Change/Create

### `app/routes/legal.cookies.tsx` (NEW)

**Objective:** Create the Cookies route that loads and renders the Cookie Policy content based on user locale.

**Pseudocode:**

```pseudocode
IMPORTS
  - React Router types and hooks (LoaderFunctionArgs, MetaFunction, useLoaderData)
  - i18n helpers (detectLocale, parseLangCookie, Locale)
  - getLegalContent service
  - LegalPageLayout component

EXPORT meta function
  INPUT: loader data
  IF data is null
    RETURN default title "Cookie Policy | BioLinq"
  ELSE
    RETURN title from data.title + "| BioLinq"
    RETURN description from data.description

EXPORT loader function
  INPUT: request object
  PROCESS:
    1. Extract cookie header from request
    2. Parse lang cookie using parseLangCookie(cookieHeader)
    3. Detect locale using detectLocale(request, langCookie)
    4. Call getLegalContent('cookies', locale as Locale)
    5. Return { html, title, description } from content
  OUTPUT: data object with html, title, description

EXPORT default component CookiesPage
  PROCESS:
    1. Get data from useLoaderData<typeof loader>()
    2. Render LegalPageLayout with data.html and data.title
  OUTPUT: JSX - LegalPageLayout component
```

**Implementation Notes:**
- Exact copy of `legal.terms.tsx` and `legal.privacy.tsx` pattern
- Only change: string `'cookies'` passed to `getLegalContent()`
- Only change: meta function default title is "Cookie Policy | BioLinq"

---

### `app/routes.ts` (MODIFY)

**Objective:** Register the `/cookies` route in the application router.

**Pseudocode:**

```pseudocode
EXISTING ROUTES:
  ...
  route('terms', 'routes/legal.terms.tsx'),
  route('privacy', 'routes/legal.privacy.tsx'),

ADD NEW ROUTE:
  route('cookies', 'routes/legal.cookies.tsx'),

POSITION: After 'privacy', before ':username' wildcard route
```

**Implementation Notes:**
- Add after line 23 (privacy route)
- Ensure it comes before `:username` dynamic route to avoid route collision

---

### `app/locales/en.json` (MODIFY)

**Objective:** Add i18n key for the Cookies link in the Footer.

**Pseudocode:**

```pseudocode
EXISTING KEYS:
  "footer_terms": "Terms",
  "footer_privacy": "Privacy",
  "footer_rights": "All rights reserved.",

ADD NEW KEY:
  "footer_cookies": "Cookies"

POSITION: After "footer_privacy", before "footer_rights"
```

---

### `app/locales/es.json` (MODIFY)

**Objective:** Add Spanish translation for the Cookies link.

**Pseudocode:**

```pseudocode
EXISTING KEYS:
  "footer_terms": "Términos",
  "footer_privacy": "Privacidad",
  "footer_rights": "Todos los derechos reservados.",

ADD NEW KEY:
  "footer_cookies": "Cookies"

POSITION: After "footer_privacy", before "footer_rights"
```

**Implementation Notes:**
- "Cookies" is the same in Spanish and English (international term)

---

### `app/components/landing/Footer.tsx` (MODIFY)

**Objective:** Add a link to the Cookies page in the Footer.

**Pseudocode:**

```pseudocode
EXISTING STRUCTURE:
  <footer>
    <div className="flex gap-6">
      <Link to="/terms">{t('footer_terms')}</Link>
      <Link to="/privacy">{t('footer_privacy')}</Link>
    </div>
    <p>© 2026 BioLinq. {t('footer_rights')}</p>
  </footer>

MODIFY TO:
  <footer>
    <div className="flex gap-6">
      <Link to="/terms">{t('footer_terms')}</Link>
      <Link to="/privacy">{t('footer_privacy')}</Link>
      <Link to="/cookies">{t('footer_cookies')}</Link>  <!-- ADD THIS -->
    </div>
    <p>© 2026 BioLinq. {t('footer_rights')}</p>
  </footer>
```

**Implementation Notes:**
- Add the new `Link` after the "Privacy" link
- Use same classes: `hover:underline`
- No other changes to Footer styling or structure

---

## 4. I18N Section

### Existing keys to reuse

- None - Footer already has the pattern with `footer_terms` and `footer_privacy`

### New keys to create

| Key              | English   | Spanish   |
| ---------------- | --------- | --------- |
| `footer_cookies` | Cookies   | Cookies   |

**Notes:**
- "Cookies" is an international term used in both languages
- Key follows existing naming convention (`footer_*`)

---

## 5. E2E Test Plan

### Test 1: Cookies page renders correctly in English

**Preconditions:**
- App is running
- Default language is English

**Steps:**
1. Navigate to `/cookies`
2. Wait for page to load

**Expected Result:**
- Page displays title "Cookie Policy"
- Content from `content/legal/en/cookies.md` is rendered as HTML
- LegalPageLayout is applied (Neo-Brutal styling, centered container)
- No console errors

---

### Test 2: Cookies page renders in Spanish when language is changed

**Preconditions:**
- App is running
- User is on `/cookies` in English

**Steps:**
1. Navigate to `/cookies`
2. Click language selector
3. Select "Español"
4. Wait for page to reload

**Expected Result:**
- Page displays title "Política de Cookies" (from Spanish Markdown H1)
- Content from `content/legal/es/cookies.md` is rendered
- Language selector shows "Español" as selected
- No console errors

---

### Test 3: Footer links navigate to all three legal pages

**Preconditions:**
- App is running on home page

**Steps:**
1. Scroll to footer
2. Verify "Terms", "Privacy", and "Cookies" links are visible
3. Click "Cookies" link
4. Wait for navigation to `/cookies`
5. Go back to home page
6. Click "Terms" link
7. Wait for navigation to `/terms`
8. Go back to home page
9. Click "Privacy" link
10. Wait for navigation to `/privacy`

**Expected Result:**
- All three links are visible in the footer
- Each link navigates to the correct route
- Each page renders correctly with legal content
- No console errors

---

### Test 4: Language persists across legal pages

**Preconditions:**
- App is running
- User has selected Spanish language

**Steps:**
1. Navigate to `/cookies` in Spanish
2. Verify content is in Spanish
3. Click "Terms" link in footer
4. Verify Terms page is in Spanish
5. Click "Privacy" link in footer
6. Verify Privacy page is in Spanish
7. Click "Cookies" link in footer
8. Verify Cookies page is still in Spanish

**Expected Result:**
- Language preference persists across all legal pages
- Language cookie is preserved during navigation
- Footer links all render in Spanish
- All legal content renders in Spanish

---

## 6. Additional Notes

**Why this task is simple:**
- All infrastructure already exists (LegalPageLayout, getLegalContent, i18n system)
- Cookie Policy Markdown content already exists in both languages
- Exact same pattern as existing `/terms` and `/privacy` routes
- Only adds 1 new route file, 1 new i18n key, and 1 new link

**No edge cases:**
- No user input
- No database queries
- No authentication required
- No external APIs

**Performance:**
- SSR renders the page on the server
- Markdown is parsed once per request (already cached in `getLegalContent`)
- No client-side JavaScript needed beyond React Router hydration
