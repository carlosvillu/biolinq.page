# PLANNING.md - BioLinq.page

## Overview

BioLinq.page is a minimalist Linktree alternative that prioritizes speed (<500ms load time) and simplicity. This planning document outlines the implementation phases for building the MVP as specified in the PRD.

**Key Decisions Made:**

- Auth: Google OAuth only (remove email/password)
- Database: PostgreSQL (any provider: self-hosted, Neon, Docker, etc.)
- Scope: Full PRD implementation
- Themes: All 4 themes (Brutalist, Light Minimal, Dark Mode, Colorful)

---

## Prerrequisitos (trabajo manual)

Antes de empezar, necesitas tener configurado:

- [x] Base de datos PostgreSQL disponible (self-hosted, Docker local, Neon, etc.)
- [x] Proyecto en Google Cloud Console con OAuth 2.0 credentials configuradas
- [x] Variables de entorno en `.env` con `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET`
- [ ] Cuenta en Stripe (modo test) con producto "BioLinq Premium" (5€, one-time payment)
- [ ] Stripe Webhook configurado para `checkout.session.completed`
- [ ] Variables de entorno de Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`
- [x] Propiedad de Google Analytics 4 creada con Measurement ID (formato G-XXXXXXXXXX)
- [x] Variable de entorno `GA_MEASUREMENT_ID` configurada

---

## Phases

### Phase 0: Foundation & Cleanup

**🔴 Antes:** Template con email/password auth y usuarios genéricos.
**🟢 Después:** Auth solo con Google OAuth, schema de base de datos listo para BioLinq.

#### Task 0.0.1: Migrate UI to Neo-Brutal Design System

- [x] Configure Neo-Brutal color system in `app/app.css` (Tailwind CSS v4)
- [x] Add JetBrains Mono font to root layout
- [x] Create `NeoBrutalButton` component with solid shadow + press effect
- [x] Create `NeoBrutalInput` component with solid shadow
- [x] Create `NeoBrutalCard` component with solid shadow
- [x] Migrate `Header.tsx` to Neo-Brutal design (BioLinq logo + Login button)
- [x] Migrate `Footer.tsx` to Neo-Brutal design (Terms, Privacy + Copyright)
- [x] Create `BioLinqHero.tsx` component based on mockup
- [x] Create `Sparkle.tsx` decorative component
- [x] Update `home.tsx` to use new landing components
- [x] Apply Neo-Brutal styles to `auth.login.tsx`
- [x] Apply Neo-Brutal styles to `auth.signup.tsx`
- [x] Create `/dashboard` route with placeholder ("Coming soon")
- [x] Move Footer to global layout in `root.tsx`
- [x] Add new i18n keys for landing page texts
- [x] Delete unused components: `HeroSection.tsx`, `EditorialDivider.tsx`
- [x] E2E test: Landing page renders with Neo-Brutal design
- [x] E2E test: Auth pages render with Neo-Brutal design
- [x] E2E test: Dashboard placeholder accessible for authenticated users

#### Task 0.1: Configure Google OAuth Auto Sign-Up

- [x] Remove email/password configuration from `app/lib/auth.ts`
- [x] Set `disableImplicitSignUp: false` in Google OAuth config (enable auto user creation)
- [x] Remove `/auth/signup` route and related components
- [x] Update `/auth/login` route to only show Google OAuth button
- [x] Update i18n keys to remove email/password related literals
- [x] E2E test: New user can login with Google and user is auto-created in DB
- [x] E2E test: Login page only shows Google OAuth option

#### Task 0.2: Create BioLinq Database Schema

- [x] Create `biolinks` table schema in `app/db/schema/biolinks.ts`:
  - `id` (uuid, primary key)
  - `user_id` (uuid, unique, foreign key to users, on delete cascade)
  - `username` (varchar(20), unique, not null)
  - `theme` (varchar(20), default 'light_minimal')
  - `custom_primary_color` (varchar(7), nullable) - #RRGGBB format
  - `custom_bg_color` (varchar(7), nullable) - #RRGGBB format
  - `total_views` (integer, default 0)
  - `created_at` (timestamp, default now)
  - `updated_at` (timestamp, default now)
  - Index on `username`
- [x] Create `links` table schema in `app/db/schema/links.ts`:
  - `id` (uuid, primary key)
  - `biolink_id` (uuid, foreign key to biolinks, on delete cascade)
  - `emoji` (varchar(10), nullable)
  - `title` (varchar(50), not null)
  - `url` (text, not null)
  - `position` (integer, not null)
  - `total_clicks` (integer, default 0)
  - `created_at` (timestamp, default now)
  - `updated_at` (timestamp, default now)
- [x] Create `daily_stats` table schema in `app/db/schema/dailyStats.ts`:
  - `id` (uuid, primary key)
  - `biolink_id` (uuid, foreign key to biolinks, on delete cascade)
  - `date` (date, not null)
  - `views` (integer, default 0)
  - `clicks` (integer, default 0)
  - Unique constraint on (biolink_id, date)
  - Index on (biolink_id, date)
- [x] Create `daily_link_clicks` table schema in `app/db/schema/dailyLinkClicks.ts`:
  - `id` (uuid, primary key)
  - `link_id` (uuid, foreign key to links, on delete cascade)
  - `date` (date, not null)
  - `clicks` (integer, default 0)
  - Unique constraint on (link_id, date)
  - Index on (link_id, date)
- [x] Update `users` table in `app/db/schema/users.ts`:
  - Add `is_premium` (boolean, default false)
  - Add `stripe_customer_id` (varchar(255), nullable)
- [x] Create reserved usernames constant in `app/lib/constants.ts`:
  - List: admin, api, www, app, dashboard, login, signup, settings, premium, help, support, terms, privacy, go
- [x] Export all new schemas from `app/db/schema/index.ts`
- [x] Define relations in `app/db/schema/relations.ts`:
  - users.biolink (one-to-one)
  - biolinks.user (many-to-one)
  - biolinks.links (one-to-many)
  - biolinks.dailyStats (one-to-many)
  - links.biolink (many-to-one)
  - links.dailyLinkClicks (one-to-many)
- [ ] Generate migration with `npm run db:generate`
- [ ] Run migration with `npm run db:migrate`
- [ ] Verify schema in database with SQL query

#### Task 0.3: Configure Environment Variables

- [x] Update `.env.example` with all required variables (Stripe, Google OAuth)
- [x] Document required environment variables in README or a setup guide

---

### Phase 1: Username Registration Flow

**🔴 Antes:** Usuario hace login con Google y llega al home genérico.
**🟢 Después:** Usuario hace login, se le pide elegir username único, y se crea su biolink.

#### Task 1.1: Username Claim from Home

- [x] Create `app/lib/username-validation.ts` with Zod schema
- [x] Create `app/hooks/useUsernameClaim.ts` hook
- [x] Create `/api/username/check` route
- [x] Create `/api/username/claim` route
- [x] Modify `home.tsx` loader to redirect users with biolink + handle OAuth callback
- [x] Modify `BioLinqHero.tsx` to use functional username input
- [x] Add `getUserBiolink()` to username service
- [x] Add i18n keys for username validation/errors
- [x] E2E test: Validation errors shown for invalid username
- [x] E2E test: Reserved/taken username shows error
- [x] E2E test: Logged-in user can claim username and go to dashboard
- [x] E2E test: User with biolink is redirected to dashboard from home

#### Task 1.2: Create Username Service

- [x] Create `app/services/username.server.ts`
- [x] Implement `checkUsernameAvailability(username)` function
- [x] Implement `registerUsername(userId, username)` function (creates biolink)
- [x] Implement reserved words check against constant list
- [x] Add index on `biolinks.username` for fast lookups

#### Task 1.3: ~~Create Username Registration Route~~ (REMOVED)

> **Note:** This task was removed. Username registration now happens directly from the home page. See Task 1.1.

#### Task 1.4: Update Auth Flow Redirect

- [x] OAuth callback reads `?username` param and creates biolink automatically (handled in Task 1.1)
- [x] E2E test: New user coming from OAuth with username gets biolink created

---

### Phase 2: Dashboard - Links Editor

**🔴 Antes:** Dashboard vacío sin funcionalidad.
**🟢 Después:** Usuario puede crear, editar, reordenar y eliminar hasta 5 links.

#### Task 2.1: Create Links Service

- [x] Create `app/services/links.server.ts`
- [x] Implement `getLinksByBiolinkId(biolinkId)` function
- [x] Implement `createLink(biolinkId, data)` function with position management
- [x] Implement `updateLink(linkId, data)` function
- [x] Implement `deleteLink(linkId)` function with position reordering
- [x] Implement `reorderLinks(biolinkId, linkIds[])` function
- [x] Validate max 5 links per biolink

#### Task 2.2: Create Dashboard Layout

- [x] Create `/dashboard` route with loader (require auth, fetch biolink + links)
- [x] Create dashboard header with logo, username badge, and premium status
- [x] Create responsive layout (editor left, preview right on desktop)
- [x] Add "Go Premium" button for free users
- [x] Add i18n keys for dashboard texts
- [x] E2E test: Dashboard loads correctly for authenticated user with biolink

#### Task 2.3: Create Link Editor Component

- [x] Create `app/components/dashboard/LinkEditor.tsx` (single link item)
- [x] Implement inline emoji picker (native OS or simple picker)
- [x] Implement title input (max 50 chars)
- [x] Implement URL input with validation (auto-prepend https:// if missing)
- [x] Implement delete button with confirmation
- [x] Implement drag handle for reordering
- [x] Create Zod schema for link validation

#### Task 2.4: Create Links List Component

- [x] Create `app/components/dashboard/LinksList.tsx`
- [x] Implement drag & drop reordering with `@dnd-kit/core` or similar
- [x] Show link count (e.g., "3/5")
- [x] Show "Add Link" button (disabled when at 5 links)
- [x] Implement auto-save with debounce (500ms)
- [x] Add loading states for save operations
- [x] Add i18n keys for link editor texts
- [x] E2E test: User can add, edit, reorder, and delete links
- [x] E2E test: Cannot add more than 5 links

---

### Phase 3: Public BioLink Page

**🔴 Antes:** No hay página pública para el biolink.
**🟢 Después:** Cada usuario tiene una página pública en `/:username` con su perfil y links.

#### Task 3.1: Create Public Page Route

- [x] Create `/:username` route (dynamic route for public profiles)
- [x] Implement loader to fetch biolink by username (404 if not found)
- [x] Fetch user data (name, avatar) and links
- [x] Return data for SSR rendering

#### Task 3.2: Create Public Profile Components

- [x] Create `app/components/public/ProfileHeader.tsx` (avatar, name) - Integrated in `PublicProfile.tsx`
- [x] Create `app/components/public/LinkCard.tsx` (single link with emoji, title) - Created as `PublicLinkCard.tsx`
- [x] Create `app/components/public/Watermark.tsx` (for free users)
- [x] E2E tests for all public profile components (in `public-page.spec.ts`)

> **Note:** Theme styles (Phase 4) and click tracking (`/go/:linkId`, Task 3.3) were incorrectly listed here. Components completed during Task 3.1 implementation.

#### Task 3.3: Implement Click Tracking

- [x] Create `/go/:linkId` route (redirects to target URL after tracking)
- [x] Implement loader that increments click count and performs 302 redirect to target URL
- [x] Update `links.total_clicks` counter
- [x] Update `daily_link_clicks` for premium analytics
- [x] Redirect with 302 status code

#### Task 3.4: Implement View Tracking

- [x] Create middleware or loader logic to track unique views
- [x] Use session cookie to prevent counting page refreshes
- [x] Increment `biolinks.total_views` counter
- [x] Update `daily_stats` for premium analytics
- [x] E2E test: Public page renders correctly with user data
- [x] E2E test: Link click redirects and increments counter

#### Task 3.5: Performance Optimization

- [ ] Ensure LCP < 500ms on public pages
- [ ] Minimize JavaScript bundle for public pages
- [ ] Optimize avatar loading (use Google's CDN URL)
- [ ] Inline critical CSS for above-the-fold content
- [ ] Add meta tags for SEO (title, description, OpenGraph)

#### Task 3.6: Replace Dashboard Preview with Live Iframe

- [x] Remove or deprecate the static `Preview` component from dashboard
- [x] Create `app/components/dashboard/LivePreview.tsx` component
- [x] Use the existing iPhone frame component to wrap the iframe
- [x] Point iframe `src` to `/:username` (user's public page)
- [x] Add "Refresh Preview" button (manual refresh only)
- [x] Handle iframe loading state (spinner while loading)
- [x] Ensure iframe is sandboxed appropriately for security
- [x] Add i18n key for "Refresh Preview" button
- [x] E2E test: Dashboard shows live iframe preview of user's public page
- [x] E2E test: Refresh button reloads the iframe content
- [x] Skip view/click tracking when rendering inside preview iframe

#### Task 3.7: Add User GA4 Configuration (Premium Only)

- [x] Add `ga4_measurement_id` column to `biolinks` table (varchar(20), nullable)
- [x] Generate and run migration for new column
- [x] Create `app/services/ga4.server.ts`:
  - [x] `updateGA4MeasurementId(biolinkId, userId, ga4Id)` function
  - [x] Validate GA4 ID format (G-XXXXXXXXXX)
  - [x] Check user is premium before saving (throw error if not)
- [x] Create `app/components/dashboard/GA4Settings.tsx`:
  - [x] Input field for GA4 Measurement ID
  - [x] Format validation (G-XXXXXXXXXX pattern)
  - [x] Save button with loading state
  - [x] Help text explaining what this does
  - [x] For free users: show locked state with "Premium" badge (same as customization section)
- [x] Add GA4 settings section to dashboard (below theme selector)
- [x] Create dashboard action to handle GA4 ID update (verify premium status)
- [x] Update public page (`/:username`) to load dual GA4:
  - [x] Site GA4 (from env `GA_MEASUREMENT_ID`) - always present
  - [x] User GA4 (from `biolinks.ga4_measurement_id`) - only if configured AND user is premium
- [x] Add i18n keys for GA4 settings UI (including premium lock message)
- [x] E2E test: Premium user can save valid GA4 ID
- [x] E2E test: Invalid GA4 ID format shows validation error
- [x] E2E test: Free user sees locked GA4 section with premium badge
- [x] E2E test: Public page includes user GA4 script only for premium users

---

### Phase 4: Theme System

**🔴 Antes:** Solo un estilo para la página pública.
**🟢 Después:** Usuario puede elegir entre 4 temas, premium users pueden customizar colores.

#### Task 4.1: Define Theme Configuration

- [x] Create `app/lib/themes.ts` with 4 theme definitions:
  - Brutalist: white bg, black borders, bold typography
  - Light Minimal: light bg, subtle shadows, clean sans-serif
  - Dark Mode: dark bg (#121212), light text, gray accents
  - Colorful: soft gradients, vibrant colors
- [x] Define CSS variables for each theme
- [x] Define TypeScript types for theme configuration

#### Task 4.3: Create Theme Service

- [x] Create `app/services/theme.server.ts`
- [x] Implement `updateBiolinkTheme(biolinkId, theme)` function
- [x] Implement `updateBiolinkColors(biolinkId, customColors)` function
- [x] Validate custom colors only for premium users
- [x] E2E tests for theme service

#### Task 4.2: Create Theme Selector Component

- [x] Create `app/components/dashboard/ThemeSelector.tsx`
- [x] Show 4 theme preview cards (2x2 grid)
- [x] Highlight currently selected theme
- [x] For premium users: show color pickers for primary and background
- [x] For free users: lock custom colors with "Premium" badge
- [x] Add i18n keys for theme names

#### Task 4.4: Integrate Theme in Dashboard

- [x] Add theme selector section to dashboard
- [x] Implement action to update theme
- [x] Live iframe preview reflects selected theme after refresh
- [x] E2E test: User can change theme and see preview update (after refresh)
- [x] E2E test: Free user cannot save custom colors

---

### Phase 5: Analytics Dashboard

**🔴 Antes:** No hay estadísticas.
**🟢 Después:** Usuarios ven visitas totales (free) o analytics completas (premium).

#### Task 5.1: Create Analytics Service

- [x] Create `app/services/analytics.server.ts`
- [x] Implement `getBasicStats(biolinkId)` - total views only
- [x] Implement `getPremiumStats(biolinkId)` - views, clicks, per-link clicks, 30-day history
- [x] Implement `getLast30DaysData(biolinkId)` for chart data

#### Task 5.2: Create Stats Components

- [x] Create `app/components/dashboard/StatsOverview.tsx` (basic stats display)
- [x] Create `app/components/dashboard/DailyChart.tsx` (CSS-only 7-day chart)
- [x] Create `app/components/dashboard/LinkPerformance.tsx` (per-link bars with Base UI Meter)
- [x] Create `app/components/dashboard/PremiumLock.tsx` (reusable premium overlay)
- [x] E2E tests for stats components

#### Task 5.3: Integrate Stats in Dashboard

- [x] Add stats section to dashboard above links editor
- [x] For free users: show total views + locked premium section with CTA
- [x] For premium users: show full analytics
- [x] Add i18n keys for analytics texts
- [x] E2E test: Free user sees total views and premium upsell
- [x] E2E test: Premium user sees full analytics

---

### Phase 6: Stripe Integration & Premium Upgrade

**🔴 Antes:** No hay forma de pagar ni upgradearse a premium.
**🟢 Después:** Usuario puede pagar 5€ via Stripe y desbloquear features premium.

#### Task 6.1: Setup Stripe Configuration

- [x] Install Stripe SDK (`npm install stripe`)
- [x] Create `app/lib/stripe.server.ts` with Stripe client initialization
- [x] Configure Stripe product and price ID in environment

#### Task 6.2: Create Checkout Flow

- [x] Create `/api/stripe/checkout` API route
- [x] Implement Stripe Checkout session creation with user metadata
- [x] Set success_url to `/dashboard?upgrade=success`
- [x] Set cancel_url to `/dashboard?upgrade=cancelled`
- [x] Create "Go Premium" button that triggers checkout

#### Task 6.3: Create Stripe Webhook Handler

- [x] Create `/api/stripe/webhook` API route
- [x] Verify webhook signature
- [x] Handle `checkout.session.completed` event
- [x] Update user `is_premium` to true
- [x] Store `stripe_customer_id` on user record

#### Task 6.4: Implement Premium Feature Gating

- [x] Create `app/services/premium.server.ts` with `isPremium(userId)` check
- [x] Gate custom colors behind premium
- [x] Gate advanced analytics behind premium
- [x] Remove watermark for premium users on public page
- [x] Show success toast on dashboard after upgrade
- [x] Add i18n keys for premium-related texts
- [x] E2E test: Free user sees upgrade prompts
- [x] E2E test: Premium user sees unlocked features (mock Stripe in tests)

---

### Phase 7: Account Management

**🔴 Antes:** No hay página de cuenta ni forma de borrar cuenta.
**🟢 Después:** Usuario puede ver su información y borrar su cuenta.

#### Task 7.1: Create Account Page

- [x] Create `/dashboard/account` route
- [x] Show user info (email, name, avatar) - all readonly from Google
- [x] Show premium status (badge or CTA)
- [x] Show biolink URL with copy button
- [x] Add "Delete Account" button

#### Task 7.2: Create Account Deletion Flow

- [x] Create `app/components/dashboard/DeleteAccountModal.tsx`
- [x] Require user to type their username to confirm
- [x] Create `app/services/account.server.ts` with `deleteAccount(userId)` function
- [x] Delete in order: daily_link_clicks, daily_stats, links, biolinks, sessions, accounts, user
- [x] Release username for future use
- [x] Sign out user and redirect to landing
- [x] Add i18n keys for account page texts
- [x] E2E test: User can view account info
- [x] E2E test: User can delete account with confirmation

---

### Phase 8: Landing Page

**🔴 Antes:** Landing page genérica del template.
**🟢 Después:** Landing page de BioLinq con hero, value props y CTA.

#### Task 8.1: Create Landing Page Components

- [x] Create `app/components/landing/BioLinqHero.tsx` with username input preview
- [x] Create `app/components/landing/ValueProps.tsx` (3 cards: speed, design, price)
- [x] Create `app/components/landing/BioLinqFooter.tsx`
- [x] Apply Neo-Brutal design system from STYLE_GUIDE.md

#### Task 8.2: Update Landing Page Route

- [x] Update `/` route (home.tsx) with new landing components
- [x] Add "Create my BioLink" CTA that redirects to Google OAuth
- [x] If user already logged in, redirect to dashboard
- [x] Add proper SEO meta tags
- [x] Add i18n keys for landing page texts

#### Task 8.3: Polish & Animations

- [x] Add subtle hover animations on cards
- [x] Add decorative elements (sparkles, etc.) as in mockup
- [x] Ensure responsive design (mobile-first)
- [x] E2E test: Landing page renders correctly
- [x] E2E test: CTA triggers auth flow

---

### Phase 9: Google Analytics & Metrics

**🔴 Antes:** No hay tracking de métricas ni analytics del sitio.
**🟢 Después:** GA4 integrado con eventos custom y tracking de ecommerce para Stripe.

#### Task 9.1: Setup Google Analytics 4

- [x] Install `@analytics/google-analytics` or use gtag.js directly
- [x] Create `app/lib/analytics.client.ts` with GA4 initialization
- [x] Add `GA_MEASUREMENT_ID` to `.env.example` and environment variables
- [x] Create `app/components/GoogleAnalytics.tsx` component for script injection
- [x] Add GA script to root layout (`app/root.tsx`)
- [x] Ensure GA only loads in production (or with explicit env flag)
- [x] Verify pageview tracking works on all routes

#### Task 9.2: Implement Custom Events

- [x] Create `app/lib/analytics-events.ts` with typed event functions:
  - `trackSignup()` - when user completes Google OAuth
  - `trackUsernameCreated(username)` - when user claims username
  - `trackLinkAdded()` - when user adds a new link
  - `trackLinkClicked(linkId, position)` - on public page link clicks
  - `trackThemeChanged(theme)` - when user changes theme
  - `trackPremiumCTAClicked(location)` - when user clicks upgrade button
  - `trackProfileViewed(username)` - on public biolink page view
  - `trackLinksReordered()` - When user reorder links
  - `trackThemeColorsChanged()` - when user change theme colors
  - `trackLinkDeleted()` - when user deletes a link
  - `trackCustomDomainSet/Verified/Removed()` - custom domain flow
  - `trackLanguageChanged()` - when user changes language
- [x] Add event tracking calls in relevant components/actions
- [x] Create custom hook `useAnalytics()` for client-side event tracking
- [x] Add i18n consideration: track language preference via `setLanguageProperty()`

#### Task 9.3: Implement Ecommerce Tracking for Stripe

- [x] Track `begin_checkout` event when user clicks "Go Premium"
- [x] Track `purchase` event on successful Stripe checkout:
  - `transaction_id`: Stripe session ID
  - `value`: 5.00
  - `currency`: EUR
  - `items`: [{ item_name: "BioLinq Premium", price: 5.00 }]
- [x] Pass user ID to GA for cross-device tracking (hashed)
- [x] Update Stripe success redirect to trigger purchase event
- [x] Verify ecommerce events appear in GA4 Monetization reports

#### Task 9.4: Dashboard & Authenticated Area Tracking

- [x] Track dashboard pageviews with user properties (is_premium, has_biolink)
- [x] Track account page visits
- [x] Track delete account flow started/completed
- [x] Add user properties to GA4:
  - `user_type`: "free" | "premium"
  - `has_biolink`: boolean
  - `link_count`: number
- [x] Ensure no PII is sent to GA (no email, no full name)

#### Task 9.5: Consent & Privacy Compliance

- [x] Create cookie consent banner component (GDPR compliance)
- [x] Store consent preference in localStorage
- [x] Only initialize GA after user consent
- [x] Add "Analytics" section to privacy policy page (if exists)
- [x] Implement `gtag('consent', 'default', {...})` for consent mode
- [x] E2E test: GA does not load without consent
- [x] E2E test: GA loads after consent is given

---

### Phase 10: Final Polish & Testing

**🔴 Antes:** Features implementadas pero sin pulir.
**🟢 Después:** App lista para producción con tests completos.

#### Task 10.1: Error Handling & Edge Cases

- [ ] Add 404 page for non-existent usernames
- [ ] Add error boundaries for React errors
- [ ] Add rate limiting for API routes (optional, can use Netlify)
- [ ] Handle Stripe webhook retries gracefully

#### Task 10.2: Complete E2E Test Suite

- [ ] Test complete user journey: landing → signup → username → add links → view public page
- [ ] Test premium upgrade flow (mock Stripe)
- [ ] Test account deletion flow
- [ ] Test all validation error messages
- [ ] Run `npm run test:e2e` - all tests pass

#### Task 10.3: Final Checks

- [ ] Run `npm run typecheck` - no errors
- [ ] Run `npm run lint` - no errors
- [ ] Test LCP on public pages < 500ms
- [ ] Verify all i18n keys have translations
- [ ] Review KNOWN_ISSUES.md and ensure no documented issues were reintroduced

---

### Phase 11: Legal & Cookie Pages

**🔴 Antes:** Footer tiene links a /terms y /privacy que devuelven 404. No hay página de cookies.
**🟢 Después:** Tres páginas legales funcionando con contenido en Markdown, cambiando idioma según selector.

#### Task 11.1: Setup Markdown Infrastructure

- [x] Install `marked` package for Markdown parsing
- [x] Create `content/legal/en/` and `content/legal/es/` directories
- [x] Create `content/legal/en/terms.md` with Terms of Service template
- [x] Create `content/legal/es/terms.md` with Términos de Servicio template
- [x] Create `content/legal/en/privacy.md` with Privacy Policy template
- [x] Create `content/legal/es/privacy.md` with Política de Privacidad template
- [x] Create `content/legal/en/cookies.md` with Cookie Policy template
- [x] Create `content/legal/es/cookies.md` with Política de Cookies template

#### Task 11.2: Create Legal Content Service

- [x] Create `app/services/legal-content.server.ts`
- [x] Implement `getLegalContent(page, locale)` function
- [x] Read Markdown file from `content/legal/{locale}/{page}.md`
- [x] Fallback to English if locale file not found
- [x] Parse Markdown to HTML using `marked`
- [x] Extract title from first H1 heading
- [x] Return `{ html, title }` object

#### Task 11.3: Create Legal Page Layout Component

- [x] Create `app/components/legal/LegalPageLayout.tsx`
- [x] Accept `html` and `title` props
- [x] Render HTML with `dangerouslySetInnerHTML`
- [x] Apply Tailwind `prose` classes for typography
- [x] Style with Neo-Brutal design (bg-neo-canvas, borders)
- [x] Ensure responsive design (max-w-3xl, centered)

#### Task 11.4: Create Terms Route

- [x] Create `app/routes/legal.terms.tsx`
- [x] Implement loader: detect locale, call `getLegalContent('terms', locale)`
- [x] Add meta function for SEO (title, description)
- [x] Render `LegalPageLayout` with loader data
- [x] Register route `/terms` in `app/routes.ts`
- [x] E2E test: Terms page renders in English by default
- [x] E2E test: Terms page renders in Spanish when language changed

#### Task 11.5: Create Privacy Route

- [ ] Create `app/routes/legal.privacy.tsx`
- [ ] Implement loader: detect locale, call `getLegalContent('privacy', locale)`
- [ ] Add meta function for SEO (title, description)
- [ ] Render `LegalPageLayout` with loader data
- [ ] Register route `/privacy` in `app/routes.ts`
- [ ] E2E test: Privacy page renders correctly
- [ ] E2E test: Privacy page changes language with selector

#### Task 11.6: Create Cookies Route & Update Footer

- [ ] Create `app/routes/legal.cookies.tsx`
- [ ] Implement loader: detect locale, call `getLegalContent('cookies', locale)`
- [ ] Add meta function for SEO (title, description)
- [ ] Render `LegalPageLayout` with loader data
- [ ] Register route `/cookies` in `app/routes.ts`
- [ ] Add `footer_cookies` i18n key (en: "Cookies", es: "Cookies")
- [ ] Update `Footer.tsx` to include link to `/cookies`
- [ ] E2E test: Cookies page renders correctly
- [ ] E2E test: Footer links navigate to all three legal pages
- [ ] E2E test: Language persists across legal pages

---

### Phase 12: Blog (SEO Content Marketing)

**🔴 Antes:** No hay blog ni contenido SEO. El sitio solo tiene páginas funcionales.
**🟢 Después:** Blog con landing `/blog`, posts en MD estático bilingüe (en/es), optimizado para SEO con Schema.org, Open Graph, y internal linking a la app.

#### Task 12.1: Create Blog Content Service

- [x] Create `app/services/blog-content.server.ts`
- [x] Implement `getBlogPost(slug, locale)` function:
  - Read MD from `content/blog/{locale}/{slug}.md`
  - Fallback to English if locale file not found
  - Parse frontmatter (title, slug, description, date, updatedDate, author, tags, coverImage, coverAlt, readingTime, canonicalSlug)
  - Parse Markdown to HTML with `marked`
  - Sanitize HTML with `sanitize-html`
  - Return `{ html, meta }` object
- [x] Implement `getAllBlogPosts(locale)` function:
  - Scan `content/blog/{locale}/` directory for all `.md` files
  - Parse frontmatter only (skip body for performance)
  - Sort by date descending
  - Return array of post metadata
- [x] Implement `getRelatedPosts(currentSlug, tags, locale, limit)` function:
  - Find posts sharing tags with current post
  - Exclude current post
  - Return up to `limit` related posts
- [x] Define TypeScript types: `BlogPostMeta`, `BlogPost`
- [x] Define frontmatter Zod schema for validation

#### Task 12.2: Create Blog Post Markdown Template & Seed Post

- [x] Create `content/blog/en/` and `content/blog/es/` directories
- [x] Define frontmatter format:
  ```yaml
  ---
  title: "Post Title"
  slug: "post-slug-in-this-language"
  canonicalSlug: "post-slug-en"  # Always the English slug, used to match translations
  description: "SEO meta description (max 160 chars)"
  date: "2026-02-06"
  updatedDate: "2026-02-06"  # Optional, for Schema.org dateModified
  author: "BioLinq Team"
  tags: ["link-in-bio", "personal-branding"]
  coverImage: "/blog/covers/post-slug.webp"
  coverAlt: "Descriptive alt text for cover image"
  readingTime: 5
  ---
  ```
- [x] Create 1 seed post in English: `content/blog/en/what-is-link-in-bio.md`
  - SEO-optimized content about "what is a link in bio"
  - Include internal links to BioLinq features
  - Use proper heading hierarchy (H2, H3)
  - Include CTA to create a BioLinq account
- [x] Create matching Spanish post: `content/blog/es/que-es-link-in-bio.md`
  - Same `canonicalSlug` as English version
  - Different `slug` (localized)
- [x] Create placeholder cover image or document the expected path

#### Task 12.3: Create Blog Landing Page

- [x] Create `app/routes/blog.index.tsx` route
- [x] Implement loader:
  - Detect locale from cookie/Accept-Language
  - Call `getAllBlogPosts(locale)`
  - Return posts metadata
- [x] Add meta function with SEO tags:
  - Title: "Blog - BioLinq" / "Blog - BioLinq"
  - Description: SEO description for the blog landing
  - Open Graph tags (og:title, og:description, og:type=website)
  - Twitter Card tags (twitter:card=summary_large_image, twitter:title, twitter:description)
  - `og:locale` and `og:locale:alternate` for multilingual OG
  - `<link rel="canonical" />`
  - Cache headers: `public, max-age=1800, s-maxage=3600`
- [x] Create `app/components/blog/BlogPostCard.tsx`:
  - Cover image, title, description, date, reading time, tags (as badges)
  - Link to `/blog/{slug}`
  - Neo-Brutal design (border-[3px], shadow, hover lift)
- [x] Create `app/components/blog/BlogHeader.tsx`:
  - Blog title, short description
  - Neo-Brutal styling consistent with landing
- [x] Compose components in route (page as puzzle)
- [x] Register route `/blog` in `app/routes.ts`
- [x] Add i18n keys for blog landing texts
- [x] E2E test: Blog landing renders with post cards
- [x] E2E test: Blog landing shows correct language content

#### Task 12.4: Create Blog Post Page

- [x] Create `app/routes/blog.post.tsx` route (for `/blog/:slug`)
- [x] Implement loader:
  - Detect locale
  - Call `getBlogPost(slug, locale)`
  - Return 404 if post not found
  - Call `getRelatedPosts()` for sidebar/footer
- [x] Add meta function with full SEO:
  - Title: `{postTitle} - BioLinq Blog`
  - `<meta name="description" content="{post.description}" />`
  - Open Graph tags (og:title, og:description, og:image, og:type=article)
  - `<meta property="article:published_time" />`
  - `<meta property="article:tag" />` for each tag
  - `<link rel="canonical" />` pointing to English version (canonicalSlug)
  - `<link rel="alternate" hreflang="en" />`
  - `<link rel="alternate" hreflang="es" />`
  - Schema.org `BlogPosting` structured data (JSON-LD) with datePublished + dateModified
  - `{ name: 'robots', content: 'index, follow' }`
  - Twitter Card tags (twitter:card=summary_large_image, twitter:title, twitter:description, twitter:image)
  - `og:locale` (en_US/es_ES) and `og:locale:alternate`
  - Cache headers: `public, max-age=3600, s-maxage=86400`
- [x] Create `app/components/blog/BlogPostLayout.tsx`:
  - Post header (title, date, author, reading time, tags)
  - Prose-styled content area (`prose` Tailwind classes)
  - Table of contents (optional, extracted from headings)
  - Neo-Brutal design consistent with legal pages
- [x] Create `app/components/blog/RelatedPosts.tsx`:
  - Section at bottom of post with related post cards
  - CTA to go back to blog or create a BioLinq account
- [x] Register route `/blog/:slug` in `app/routes.ts`
- [x] Add i18n keys for blog post page texts
- [x] E2E test: Blog post renders with correct content
- [x] E2E test: Blog post shows proper SEO meta tags
- [x] E2E test: Related posts section renders
- [x] E2E test: 404 for non-existent post slug

#### Task 12.5: Update Footer & Sitemap

- [ ] Add "Blog" link to `Footer.tsx` (pointing to `/blog`)
- [ ] Add `footer_blog` i18n key (en: "Blog", es: "Blog")
- [ ] Update `sitemap.xml` route to include:
  - `/blog` landing page
  - All individual blog post URLs (scan content directory)
  - Proper `<lastmod>` from post dates
  - `<changefreq>weekly</changefreq>` for blog landing
  - `<changefreq>monthly</changefreq>` for individual posts
- [ ] E2E test: Footer contains blog link
- [ ] E2E test: Sitemap includes blog URLs

#### Task 12.6: Blog Analytics Integration

- [ ] Track `blog_post_viewed` event with post slug and tags
- [ ] Track `blog_cta_clicked` event when user clicks internal CTA links
- [ ] Add blog events to `app/lib/analytics-events.ts`
- [ ] E2E test: Blog post view triggers analytics event (with consent)

---

## Implementation Order

Sequential list of all tasks in recommended order:

1. Task 0.0.1 - Migrate UI to Neo-Brutal Design System
2. Task 0.1 - Configure Google OAuth Auto Sign-Up
3. Task 0.2 - Create BioLinq Database Schema
4. Task 0.3 - Configure Environment Variables
5. Task 1.1 - Create Username Selection Modal
6. Task 1.2 - Create Username Service
7. Task 1.3 - Create Username Registration Route
8. Task 1.4 - Update Auth Flow Redirect
9. Task 2.1 - Create Links Service
10. Task 2.2 - Create Dashboard Layout
11. Task 2.3 - Create Link Editor Component
12. Task 2.4 - Create Links List Component
13. Task 3.1 - Create Public Page Route
14. Task 3.2 - Create Public Profile Components
15. Task 3.3 - Implement Click Tracking
16. Task 3.4 - Implement View Tracking
17. Task 3.5 - Performance Optimization
18. Task 3.6 - Replace Dashboard Preview with Live Iframe
19. Task 3.7 - Add User GA4 Configuration
20. Task 4.1 - Define Theme Configuration
21. Task 4.2 - Create Theme Selector Component
22. Task 4.3 - Create Theme Service
23. Task 4.4 - Integrate Theme in Dashboard
24. Task 5.1 - Create Analytics Service
25. Task 5.2 - Create Stats Components
26. Task 5.3 - Integrate Stats in Dashboard
27. Task 6.1 - Setup Stripe Configuration
28. Task 6.2 - Create Checkout Flow
29. Task 6.3 - Create Stripe Webhook Handler
30. Task 6.4 - Implement Premium Feature Gating
31. Task 7.1 - Create Account Page
32. Task 7.2 - Create Account Deletion Flow
33. Task 8.1 - Create Landing Page Components
34. Task 8.2 - Update Landing Page Route
35. Task 8.3 - Polish & Animations
36. Task 9.1 - Setup Google Analytics 4
37. Task 9.2 - Implement Custom Events
38. Task 9.3 - Implement Ecommerce Tracking for Stripe
39. Task 9.4 - Dashboard & Authenticated Area Tracking
40. Task 9.5 - Consent & Privacy Compliance
41. Task 10.1 - Error Handling & Edge Cases
42. Task 10.2 - Complete E2E Test Suite
43. Task 10.3 - Final Checks
44. Task 11.1 - Setup Markdown Infrastructure
45. Task 11.2 - Create Legal Content Service
46. Task 11.3 - Create Legal Page Layout Component
47. Task 11.4 - Create Terms Route
48. Task 11.5 - Create Privacy Route
49. Task 11.6 - Create Cookies Route & Update Footer
50. Task 12.1 - Create Blog Content Service
51. Task 12.2 - Create Blog Post Markdown Template & Seed Post
52. Task 12.3 - Create Blog Landing Page
53. Task 12.4 - Create Blog Post Page
54. Task 12.5 - Update Footer & Sitemap
55. Task 12.6 - Blog Analytics Integration

---

## Risk Mitigation

| Risk                        | Impact | Mitigation                                            |
| --------------------------- | ------ | ----------------------------------------------------- |
| Stripe webhook reliability  | High   | Implement idempotency keys, handle retries gracefully |
| Username squatting          | Low    | Reserved words list, no secondary market              |
| Performance on public pages | High   | SSR, minimal JS, inline critical CSS, CDN for avatars |
| Google OAuth failures       | Medium | Clear error messages, retry logic                     |
| Database connection issues  | High   | Connection pooling, proper error handling             |
| GA blocking performance     | Medium | Async loading, defer scripts, consent mode            |
| GDPR/Privacy compliance     | High   | Cookie consent banner, consent mode v2, no PII to GA  |
| Blog SEO not indexing       | Medium | Schema.org markup, canonical URLs, hreflang, sitemap  |
| Blog content duplication    | Low    | canonicalSlug links EN/ES versions, hreflang alternate |

---

## Open Questions

- [ ] Should we implement rate limiting at app level or rely on Netlify?
- [ ] Do we need email notifications for premium upgrades?
- [ ] Should the username be displayed in the header or derived from the URL?

---

## Progress Tracker

| Phase | Task  | Status         | Notes                                   |
| ----- | ----- | -------------- | --------------------------------------- |
| 0     | 0.0.1 | ✅ Complete    | Migrate UI to Neo-Brutal design         |
| 0     | 0.1   | ✅ Complete    | Configure Google OAuth auto sign-up     |
| 0     | 0.2   | ✅ Complete    | Create DB schema                        |
| 0     | 0.3   | ⬜ Not Started | Configure env vars                      |
| 1     | 1.1   | ⬜ Not Started | Username modal                          |
| 1     | 1.2   | ⬜ Not Started | Username service                        |
| 1     | 1.3   | ⬜ Not Started | Username route                          |
| 1     | 1.4   | ⬜ Not Started | Auth flow redirect                      |
| 2     | 2.1   | ⬜ Not Started | Links service                           |
| 2     | 2.2   | ⬜ Not Started | Dashboard layout                        |
| 2     | 2.3   | ⬜ Not Started | Link editor component                   |
| 2     | 2.4   | ⬜ Not Started | Links list component                    |
| 3     | 3.1   | ✅ Complete    | Public page route                       |
| 3     | 3.2   | ✅ Complete    | Public profile components (done in 3.1) |
| 3     | 3.3   | ⬜ Not Started | Click tracking                          |
| 3     | 3.4   | ✅ Complete    | View tracking                           |
| 3     | 3.5   | ⬜ Not Started | Performance optimization                |
| 3     | 3.6   | ✅ Complete    | Live iframe preview in dashboard        |
| 3     | 3.7   | ✅ Complete    | User GA4 configuration (Premium)        |
| 4     | 4.1   | ✅ Complete    | Theme configuration                     |
| 4     | 4.2   | ✅ Complete    | Theme selector                          |
| 4     | 4.3   | ✅ Complete    | Theme service                           |
| 4     | 4.4   | ✅ Complete    | Theme integration                       |
| 5     | 5.1   | ✅ Complete    | Analytics service                       |
| 5     | 5.2   | ✅ Complete    | Stats components                        |
| 5     | 5.3   | ⬜ Not Started | Stats integration                       |
| 6     | 6.1   | ⬜ Not Started | Stripe configuration                    |
| 6     | 6.2   | ⬜ Not Started | Checkout flow                           |
| 6     | 6.3   | ⬜ Not Started | Webhook handler                         |
| 6     | 6.4   | ⬜ Not Started | Premium feature gating                  |
| 7     | 7.1   | ⬜ Not Started | Account page                            |
| 7     | 7.2   | ⬜ Not Started | Account deletion                        |
| 8     | 8.1   | ⬜ Not Started | Landing components                      |
| 8     | 8.2   | ⬜ Not Started | Landing route                           |
| 8     | 8.3   | ⬜ Not Started | Polish & animations                     |
| 9     | 9.1   | ⬜ Not Started | Setup Google Analytics 4                |
| 9     | 9.2   | ✅ Complete    | Custom events                           |
| 9     | 9.3   | ✅ Complete    | Ecommerce tracking (Stripe)             |
| 9     | 9.4   | ⬜ Not Started | Dashboard tracking                      |
| 9     | 9.5   | ⬜ Not Started | Consent & privacy                       |
| 10    | 10.1  | ⬜ Not Started | Error handling                          |
| 10    | 10.2  | ⬜ Not Started | E2E test suite                          |
| 10    | 10.3  | ⬜ Not Started | Final checks                            |
| 11    | 11.1  | ✅ Complete    | Setup Markdown infrastructure           |
| 11    | 11.2  | ✅ Complete    | Legal content service                   |
| 11    | 11.3  | ⬜ Not Started | Legal page layout component             |
| 11    | 11.4  | ⬜ Not Started | Terms route                             |
| 11    | 11.5  | ⬜ Not Started | Privacy route                           |
| 11    | 11.6  | ⬜ Not Started | Cookies route & footer update           |
| 12    | 12.1  | ⬜ Not Started | Blog content service                    |
| 12    | 12.2  | ⬜ Not Started | Blog MD template & seed post            |
| 12    | 12.3  | ⬜ Not Started | Blog landing page                       |
| 12    | 12.4  | ⬜ Not Started | Blog post page                          |
| 12    | 12.5  | ⬜ Not Started | Footer & sitemap update                 |
| 12    | 12.6  | ⬜ Not Started | Blog analytics integration              |

**Status Legend:** ⬜ Not Started | 🔄 In Progress | ✅ Complete | ⏸️ Blocked
