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

### Phase 3: Theme System

**🔴 Antes:** Solo un estilo para la página pública.
**🟢 Después:** Usuario puede elegir entre 4 temas, premium users pueden customizar colores.

#### Task 3.1: Define Theme Configuration

- [ ] Create `app/lib/themes.ts` with 4 theme definitions:
  - Brutalist: white bg, black borders, bold typography
  - Light Minimal: light bg, subtle shadows, clean sans-serif
  - Dark Mode: dark bg (#121212), light text, gray accents
  - Colorful: soft gradients, vibrant colors
- [ ] Define CSS variables for each theme
- [ ] Define TypeScript types for theme configuration

#### Task 3.2: Create Theme Selector Component

- [ ] Create `app/components/dashboard/ThemeSelector.tsx`
- [ ] Show 4 theme preview cards (2x2 grid)
- [ ] Highlight currently selected theme
- [ ] For premium users: show color pickers for primary and background
- [ ] For free users: lock custom colors with "Premium" badge
- [ ] Add i18n keys for theme names

#### Task 3.3: Create Theme Service

- [ ] Create `app/services/theme.server.ts`
- [ ] Implement `updateBiolinkTheme(biolinkId, theme, customColors?)` function
- [ ] Validate custom colors only for premium users

#### Task 3.4: Integrate Theme in Dashboard

- [ ] Add theme selector section to dashboard
- [ ] Implement action to update theme
- [ ] Update preview to reflect selected theme in real-time
- [ ] E2E test: User can change theme and see preview update
- [ ] E2E test: Free user cannot save custom colors

---

### Phase 4: Public BioLink Page

**🔴 Antes:** No hay página pública para el biolink.
**🟢 Después:** Cada usuario tiene una página pública en `/:username` con su perfil y links.

#### Task 4.1: Create Public Page Route

- [ ] Create `/:username` route (dynamic route for public profiles)
- [ ] Implement loader to fetch biolink by username (404 if not found)
- [ ] Fetch user data (name, avatar) and links
- [ ] Return data for SSR rendering

#### Task 4.2: Create Public Profile Components

- [ ] Create `app/components/public/ProfileHeader.tsx` (avatar, name)
- [ ] Create `app/components/public/LinkCard.tsx` (single link with emoji, title)
- [ ] Create `app/components/public/Watermark.tsx` (for free users)
- [ ] Apply selected theme styles dynamically
- [ ] Implement click tracking redirect through `/go/:linkId`

#### Task 4.3: Implement Click Tracking

- [ ] Create `/go/:linkId` route
- [ ] Implement loader that increments click count and redirects to target URL
- [ ] Update `links.total_clicks` counter
- [ ] Update `daily_link_clicks` for premium analytics
- [ ] Redirect with 302 status code

#### Task 4.4: Implement View Tracking

- [ ] Create middleware or loader logic to track unique views
- [ ] Use session cookie to prevent counting page refreshes
- [ ] Increment `biolinks.total_views` counter
- [ ] Update `daily_stats` for premium analytics
- [ ] E2E test: Public page renders correctly with user data
- [ ] E2E test: Link click redirects and increments counter

#### Task 4.5: Performance Optimization

- [ ] Ensure LCP < 500ms on public pages
- [ ] Minimize JavaScript bundle for public pages
- [ ] Optimize avatar loading (use Google's CDN URL)
- [ ] Inline critical CSS for above-the-fold content
- [ ] Add meta tags for SEO (title, description, OpenGraph)

---

### Phase 5: Analytics Dashboard

**🔴 Antes:** No hay estadísticas.
**🟢 Después:** Usuarios ven visitas totales (free) o analytics completas (premium).

#### Task 5.1: Create Analytics Service

- [ ] Create `app/services/analytics.server.ts`
- [ ] Implement `getBasicStats(biolinkId)` - total views only
- [ ] Implement `getPremiumStats(biolinkId)` - views, clicks, per-link clicks, 30-day history
- [ ] Implement `getLast30DaysData(biolinkId)` for chart data

#### Task 5.2: Create Stats Components

- [ ] Create `app/components/dashboard/StatsCard.tsx` (basic stats display)
- [ ] Create `app/components/dashboard/PremiumStatsCard.tsx` (locked for free users)
- [ ] Create `app/components/dashboard/ClicksChart.tsx` (30-day line chart)
- [ ] Create `app/components/dashboard/LinkClicksBreakdown.tsx` (per-link bars)
- [ ] Use a lightweight chart library (e.g., recharts or chart.js)

#### Task 5.3: Integrate Stats in Dashboard

- [ ] Add stats section to dashboard above links editor
- [ ] For free users: show total views + locked premium section with CTA
- [ ] For premium users: show full analytics
- [ ] Add i18n keys for analytics texts
- [ ] E2E test: Free user sees total views and premium upsell
- [ ] E2E test: Premium user sees full analytics

---

### Phase 6: Stripe Integration & Premium Upgrade

**🔴 Antes:** No hay forma de pagar ni upgradearse a premium.
**🟢 Después:** Usuario puede pagar 5€ via Stripe y desbloquear features premium.

#### Task 6.1: Setup Stripe Configuration

- [ ] Install Stripe SDK (`npm install stripe`)
- [ ] Create `app/lib/stripe.server.ts` with Stripe client initialization
- [ ] Configure Stripe product and price ID in environment

#### Task 6.2: Create Checkout Flow

- [ ] Create `/api/stripe/checkout` API route
- [ ] Implement Stripe Checkout session creation with user metadata
- [ ] Set success_url to `/dashboard?upgrade=success`
- [ ] Set cancel_url to `/dashboard?upgrade=cancelled`
- [ ] Create "Go Premium" button that triggers checkout

#### Task 6.3: Create Stripe Webhook Handler

- [ ] Create `/api/stripe/webhook` API route
- [ ] Verify webhook signature
- [ ] Handle `checkout.session.completed` event
- [ ] Update user `is_premium` to true
- [ ] Store `stripe_customer_id` on user record

#### Task 6.4: Implement Premium Feature Gating

- [ ] Create `app/services/premium.server.ts` with `isPremium(userId)` check
- [ ] Gate custom colors behind premium
- [ ] Gate advanced analytics behind premium
- [ ] Remove watermark for premium users on public page
- [ ] Show success toast on dashboard after upgrade
- [ ] Add i18n keys for premium-related texts
- [ ] E2E test: Free user sees upgrade prompts
- [ ] E2E test: Premium user sees unlocked features (mock Stripe in tests)

---

### Phase 7: Account Management

**🔴 Antes:** No hay página de cuenta ni forma de borrar cuenta.
**🟢 Después:** Usuario puede ver su información y borrar su cuenta.

#### Task 7.1: Create Account Page

- [ ] Create `/dashboard/account` route
- [ ] Show user info (email, name, avatar) - all readonly from Google
- [ ] Show premium status (badge or CTA)
- [ ] Show biolink URL with copy button
- [ ] Add "Delete Account" button

#### Task 7.2: Create Account Deletion Flow

- [ ] Create `app/components/dashboard/DeleteAccountModal.tsx`
- [ ] Require user to type their username to confirm
- [ ] Create `app/services/account.server.ts` with `deleteAccount(userId)` function
- [ ] Delete in order: daily_link_clicks, daily_stats, links, biolinks, sessions, accounts, user
- [ ] Release username for future use
- [ ] Sign out user and redirect to landing
- [ ] Add i18n keys for account page texts
- [ ] E2E test: User can view account info
- [ ] E2E test: User can delete account with confirmation

---

### Phase 8: Landing Page

**🔴 Antes:** Landing page genérica del template.
**🟢 Después:** Landing page de BioLinq con hero, value props y CTA.

#### Task 8.1: Create Landing Page Components

- [ ] Create `app/components/landing/BioLinqHero.tsx` with username input preview
- [ ] Create `app/components/landing/ValueProps.tsx` (3 cards: speed, design, price)
- [ ] Create `app/components/landing/BioLinqFooter.tsx`
- [ ] Apply Neo-Brutal design system from STYLE_GUIDE.md

#### Task 8.2: Update Landing Page Route

- [ ] Update `/` route (home.tsx) with new landing components
- [ ] Add "Create my BioLink" CTA that redirects to Google OAuth
- [ ] If user already logged in, redirect to dashboard
- [ ] Add proper SEO meta tags
- [ ] Add i18n keys for landing page texts

#### Task 8.3: Polish & Animations

- [ ] Add subtle hover animations on cards
- [ ] Add decorative elements (sparkles, etc.) as in mockup
- [ ] Ensure responsive design (mobile-first)
- [ ] E2E test: Landing page renders correctly
- [ ] E2E test: CTA triggers auth flow

---

### Phase 9: Google Analytics & Metrics

**🔴 Antes:** No hay tracking de métricas ni analytics del sitio.
**🟢 Después:** GA4 integrado con eventos custom y tracking de ecommerce para Stripe.

#### Task 9.1: Setup Google Analytics 4

- [ ] Install `@analytics/google-analytics` or use gtag.js directly
- [ ] Create `app/lib/analytics.client.ts` with GA4 initialization
- [ ] Add `GA_MEASUREMENT_ID` to `.env.example` and environment variables
- [ ] Create `app/components/GoogleAnalytics.tsx` component for script injection
- [ ] Add GA script to root layout (`app/root.tsx`)
- [ ] Ensure GA only loads in production (or with explicit env flag)
- [ ] Verify pageview tracking works on all routes

#### Task 9.2: Implement Custom Events

- [ ] Create `app/lib/analytics-events.ts` with typed event functions:
  - `trackSignup()` - when user completes Google OAuth
  - `trackUsernameCreated(username)` - when user claims username
  - `trackLinkAdded()` - when user adds a new link
  - `trackLinkClicked(linkId, position)` - on public page link clicks
  - `trackThemeChanged(theme)` - when user changes theme
  - `trackPremiumCTAClicked(location)` - when user clicks upgrade button
  - `trackProfileViewed(username)` - on public biolink page view
- [ ] Add event tracking calls in relevant components/actions
- [ ] Create custom hook `useAnalytics()` for client-side event tracking
- [ ] Add i18n consideration: track language preference

#### Task 9.3: Implement Ecommerce Tracking for Stripe

- [ ] Track `begin_checkout` event when user clicks "Go Premium"
- [ ] Track `purchase` event on successful Stripe checkout:
  - `transaction_id`: Stripe session ID
  - `value`: 5.00
  - `currency`: EUR
  - `items`: [{ item_name: "BioLinq Premium", price: 5.00 }]
- [ ] Pass user ID to GA for cross-device tracking (hashed)
- [ ] Update Stripe success redirect to trigger purchase event
- [ ] Verify ecommerce events appear in GA4 Monetization reports

#### Task 9.4: Dashboard & Authenticated Area Tracking

- [ ] Track dashboard pageviews with user properties (is_premium, has_biolink)
- [ ] Track account page visits
- [ ] Track delete account flow started/completed
- [ ] Add user properties to GA4:
  - `user_type`: "free" | "premium"
  - `has_biolink`: boolean
  - `link_count`: number
- [ ] Ensure no PII is sent to GA (no email, no full name)

#### Task 9.5: Consent & Privacy Compliance

- [ ] Create cookie consent banner component (GDPR compliance)
- [ ] Store consent preference in localStorage
- [ ] Only initialize GA after user consent
- [ ] Add "Analytics" section to privacy policy page (if exists)
- [ ] Implement `gtag('consent', 'default', {...})` for consent mode
- [ ] E2E test: GA does not load without consent
- [ ] E2E test: GA loads after consent is given

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
13. Task 3.1 - Define Theme Configuration
14. Task 3.2 - Create Theme Selector Component
15. Task 3.3 - Create Theme Service
16. Task 3.4 - Integrate Theme in Dashboard
17. Task 4.1 - Create Public Page Route
18. Task 4.2 - Create Public Profile Components
19. Task 4.3 - Implement Click Tracking
20. Task 4.4 - Implement View Tracking
21. Task 4.5 - Performance Optimization
22. Task 5.1 - Create Analytics Service
23. Task 5.2 - Create Stats Components
24. Task 5.3 - Integrate Stats in Dashboard
25. Task 6.1 - Setup Stripe Configuration
26. Task 6.2 - Create Checkout Flow
27. Task 6.3 - Create Stripe Webhook Handler
28. Task 6.4 - Implement Premium Feature Gating
29. Task 7.1 - Create Account Page
30. Task 7.2 - Create Account Deletion Flow
31. Task 8.1 - Create Landing Page Components
32. Task 8.2 - Update Landing Page Route
33. Task 8.3 - Polish & Animations
34. Task 9.1 - Setup Google Analytics 4
35. Task 9.2 - Implement Custom Events
36. Task 9.3 - Implement Ecommerce Tracking for Stripe
37. Task 9.4 - Dashboard & Authenticated Area Tracking
38. Task 9.5 - Consent & Privacy Compliance
39. Task 10.1 - Error Handling & Edge Cases
40. Task 10.2 - Complete E2E Test Suite
41. Task 10.3 - Final Checks

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

---

## Open Questions

- [ ] Should we implement rate limiting at app level or rely on Netlify?
- [ ] Do we need email notifications for premium upgrades?
- [ ] Should the username be displayed in the header or derived from the URL?

---

## Progress Tracker

| Phase | Task  | Status         | Notes                               |
| ----- | ----- | -------------- | ----------------------------------- |
| 0     | 0.0.1 | ✅ Complete    | Migrate UI to Neo-Brutal design     |
| 0     | 0.1   | ✅ Complete    | Configure Google OAuth auto sign-up |
| 0     | 0.2   | ✅ Complete    | Create DB schema                    |
| 0     | 0.3   | ⬜ Not Started | Configure env vars                  |
| 1     | 1.1   | ⬜ Not Started | Username modal                      |
| 1     | 1.2   | ⬜ Not Started | Username service                    |
| 1     | 1.3   | ⬜ Not Started | Username route                      |
| 1     | 1.4   | ⬜ Not Started | Auth flow redirect                  |
| 2     | 2.1   | ⬜ Not Started | Links service                       |
| 2     | 2.2   | ⬜ Not Started | Dashboard layout                    |
| 2     | 2.3   | ⬜ Not Started | Link editor component               |
| 2     | 2.4   | ⬜ Not Started | Links list component                |
| 3     | 3.1   | ⬜ Not Started | Theme configuration                 |
| 3     | 3.2   | ⬜ Not Started | Theme selector                      |
| 3     | 3.3   | ⬜ Not Started | Theme service                       |
| 3     | 3.4   | ⬜ Not Started | Theme integration                   |
| 4     | 4.1   | ⬜ Not Started | Public page route                   |
| 4     | 4.2   | ⬜ Not Started | Public profile components           |
| 4     | 4.3   | ⬜ Not Started | Click tracking                      |
| 4     | 4.4   | ⬜ Not Started | View tracking                       |
| 4     | 4.5   | ⬜ Not Started | Performance optimization            |
| 5     | 5.1   | ⬜ Not Started | Analytics service                   |
| 5     | 5.2   | ⬜ Not Started | Stats components                    |
| 5     | 5.3   | ⬜ Not Started | Stats integration                   |
| 6     | 6.1   | ⬜ Not Started | Stripe configuration                |
| 6     | 6.2   | ⬜ Not Started | Checkout flow                       |
| 6     | 6.3   | ⬜ Not Started | Webhook handler                     |
| 6     | 6.4   | ⬜ Not Started | Premium feature gating              |
| 7     | 7.1   | ⬜ Not Started | Account page                        |
| 7     | 7.2   | ⬜ Not Started | Account deletion                    |
| 8     | 8.1   | ⬜ Not Started | Landing components                  |
| 8     | 8.2   | ⬜ Not Started | Landing route                       |
| 8     | 8.3   | ⬜ Not Started | Polish & animations                 |
| 9     | 9.1   | ⬜ Not Started | Setup Google Analytics 4            |
| 9     | 9.2   | ⬜ Not Started | Custom events                       |
| 9     | 9.3   | ⬜ Not Started | Ecommerce tracking (Stripe)         |
| 9     | 9.4   | ⬜ Not Started | Dashboard tracking                  |
| 9     | 9.5   | ⬜ Not Started | Consent & privacy                   |
| 10    | 10.1  | ⬜ Not Started | Error handling                      |
| 10    | 10.2  | ⬜ Not Started | E2E test suite                      |
| 10    | 10.3  | ⬜ Not Started | Final checks                        |

**Status Legend:** ⬜ Not Started | 🔄 In Progress | ✅ Complete | ⏸️ Blocked
