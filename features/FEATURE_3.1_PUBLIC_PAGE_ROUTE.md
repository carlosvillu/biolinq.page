# FEATURE_3.1_PUBLIC_PAGE_ROUTE.md

## ✅ IMPLEMENTATION STATUS: 100% COMPLETE

**Verificado en producción: Sin fallos ✅**

---

## 1. Natural Language Description

### Current State
- Users can register usernames and create biolinks via the home page
- Users can manage their links in the dashboard
- There is a preview component (`ProfilePreviewContent`) in the dashboard that shows how the profile looks
- **There is NO public-facing page** where visitors can see a user's biolink at `/:username`

### Expected End State
- Any visitor can access `/:username` (e.g., `/carlosvillu`) to see a user's public profile
- The page displays: user avatar, display name, @username badge, and clickable links
- If the username doesn't exist, a styled 404 page invites visitors to create their own biolink
- The page includes full SEO meta tags (OpenGraph, Twitter Cards, JSON-LD)
- Free users have a "Powered by BioLinq" badge (floating, bottom corner)
- Premium users see no watermark (based on `users.isPremium`)
- The page uses the fixed "brutalist" theme (theme switching comes in Phase 4)

---

## 2. Technical Description

### High-Level Approach
1. **Create a public service function** to fetch biolink + user data by username (no auth required)
2. **Create a public links function** to fetch links without ownership validation
3. **Register a dynamic route** `/:username` as the LAST route in `app/routes.ts` (catch-all after specific routes)
4. **Build the public page component** that reuses `ProfilePreviewContent` patterns but as a standalone full page
5. **Build a 404 component** with CTA to create a biolink (Neo-Brutal styled)
6. **Add SEO meta tags** via React Router's `meta` export

### Architecture Decisions
- **Service layer**: New functions in existing services (`username.server.ts`, `links.server.ts`)
- **No new database tables**: Uses existing `biolinks`, `links`, and `users` tables
- **Reuse visual patterns**: The link cards and avatar styling from `ProfilePreviewContent` can be referenced
- **SEO-first**: Meta tags generated server-side for proper social sharing

### Dependencies
- Existing: `app/services/username.server.ts`, `app/services/links.server.ts`
- Existing: `app/db/schema/*` (biolinks, links, users)
- New: None (no new packages needed)

---

## 2.1. Architecture Gate (REQUIRED)

- **Pages are puzzles:** The route module `public.tsx` will compose components (`PublicProfile`, `PublicNotFound`) with minimal UI logic. Layout decisions and rendering are in components.
- **Loaders/actions are thin:** The loader will:
  1. Parse the `username` param
  2. Call `getBiolinkWithUserByUsername(username)` service
  3. Call `getPublicLinksByBiolinkId(biolinkId)` service
  4. Return data or throw 404
- **Business logic is not in components:**
  - Data fetching and validation lives in `app/services/username.server.ts`
  - Link fetching lives in `app/services/links.server.ts`
  - Components only render what they receive

### Route Module Summary
| Route | Services Called | Components Composed |
|-------|-----------------|---------------------|
| `/:username` | `getBiolinkWithUserByUsername`, `getPublicLinksByBiolinkId` | `PublicProfile`, `PublicNotFound`, `Watermark` |

### Component Summary
| Component | Hooks Used | Business Logic |
|-----------|------------|----------------|
| `PublicProfile` | None (pure render) | NONE - receives all data as props |
| `PublicNotFound` | `useTranslation` | NONE - pure UI |
| `Watermark` | None | NONE - pure UI, conditionally rendered based on `isPremium` prop |

---

## 3. Files to Change/Create

### `app/services/username.server.ts`
**Objective:** Add a public function to fetch a biolink with its associated user data by username (no authentication required)

**Pseudocode:**
```pseudocode
FUNCTION getBiolinkWithUserByUsername(username: string)
  INPUT: username (string, lowercase)

  PROCESS:
    QUERY db
      SELECT biolinks.*, users.name, users.image, users.isPremium
      FROM biolinks
      INNER JOIN users ON biolinks.userId = users.id
      WHERE biolinks.username = lowercase(username)
      LIMIT 1

    IF no result THEN
      RETURN null
    END IF

    RETURN {
      biolink: { id, username, theme, totalViews, ... },
      user: { name, image, isPremium }
    }

  OUTPUT: { biolink, user } | null
END
```

---

### `app/services/links.server.ts`
**Objective:** Add a public function to fetch links by biolinkId without ownership validation (for public pages)

**Pseudocode:**
```pseudocode
FUNCTION getPublicLinksByBiolinkId(biolinkId: string)
  INPUT: biolinkId (uuid)

  PROCESS:
    QUERY db
      SELECT * FROM links
      WHERE biolinkId = biolinkId
      ORDER BY position ASC

    RETURN links array

  OUTPUT: Link[] (always succeeds, may be empty)
END
```

---

### `app/routes.ts`
**Objective:** Register the dynamic `/:username` route as the LAST route (so it doesn't catch `/dashboard`, `/auth/login`, etc.)

**Pseudocode:**
```pseudocode
CURRENT:
  index('routes/home.tsx'),
  route('health/db', ...),
  route('api/auth/*', ...),
  ...
  route('dashboard', 'routes/dashboard.tsx'),

AFTER:
  index('routes/home.tsx'),
  route('health/db', ...),
  route('api/auth/*', ...),
  ...
  route('dashboard', 'routes/dashboard.tsx'),
  route(':username', 'routes/public.tsx'),  // <-- ADD LAST
```

---

### `app/routes/public.tsx`
**Objective:** Handle the public profile page for `/:username`. SSR-rendered with SEO meta tags.

**Pseudocode:**
```pseudocode
LOADER({ params })
  INPUT: params.username

  PROCESS:
    result = await getBiolinkWithUserByUsername(params.username)

    IF result IS null THEN
      THROW Response(404) with isNotFound: true
    END IF

    links = await getPublicLinksByBiolinkId(result.biolink.id)

    RETURN json({
      biolink: result.biolink,
      user: result.user,
      links: links
    })

  OUTPUT: LoaderData | 404

META({ data, error })
  IF error OR isNotFound THEN
    RETURN [
      { title: "Profile not found | BioLinq" },
      { name: "robots", content: "noindex" }
    ]
  END IF

  userName = data.user.name OR data.biolink.username
  description = `Check out ${userName}'s links on BioLinq`
  avatarUrl = data.user.image OR default_avatar_url
  pageUrl = `https://biolinq.page/${data.biolink.username}`

  RETURN [
    { title: `${userName} | BioLinq` },
    { name: "description", content: description },

    // OpenGraph
    { property: "og:title", content: userName },
    { property: "og:description", content: description },
    { property: "og:image", content: avatarUrl },
    { property: "og:url", content: pageUrl },
    { property: "og:type", content: "profile" },

    // Twitter Cards
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: userName },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: avatarUrl },

    // Canonical
    { tagName: "link", rel: "canonical", href: pageUrl }
  ]

COMPONENT PublicPage
  data = useLoaderData()
  isNotFound = check if route is 404 (via isRouteErrorResponse)

  IF isNotFound THEN
    RENDER PublicNotFound component
  ELSE
    RENDER PublicProfile with { user, biolink, links }
  END IF

ERROR_BOUNDARY
  IF isRouteErrorResponse AND status === 404 THEN
    RENDER PublicNotFound
  ELSE
    RENDER generic error
  END IF
```

---

### `app/components/public/PublicProfile.tsx`
**Objective:** Render the full public profile page (avatar, name, username badge, links list). Centered layout with max-width.

**Pseudocode:**
```pseudocode
COMPONENT PublicProfile
  PROPS:
    user: { name, image, isPremium }
    biolink: { username }
    links: Link[]

  RENDER:
    <main className="min-h-screen bg-canvas flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-md">

        // Avatar - Neo-Brutal circle with shadow
        <div className="avatar-container centered with border-[3px] border-dark shadow-hard">
          IF user.image THEN <img src={user.image} />
          ELSE <fallback with first letter of name>
        </div>

        // Name
        <h1 className="text-2xl font-black text-center">{user.name}</h1>

        // Username badge
        <p className="font-mono text-sm text-gray-600">@{biolink.username}</p>

        // Links list
        <div className="space-y-4 mt-8">
          FOR each link IN links
            RENDER PublicLinkCard with { link }
          END FOR

          IF links.length === 0 THEN
            RENDER empty state message (t('public_no_links'))
          END IF
        </div>

      </div>

      // Watermark (conditional)
      IF NOT user.isPremium THEN
        RENDER Watermark
      END IF
    </main>
```

---

### `app/components/public/PublicLinkCard.tsx`
**Objective:** Render a single clickable link card with Neo-Brutal styling. Links open in new tab with tracking URL (to be implemented in Task 3.3).

**Pseudocode:**
```pseudocode
COMPONENT PublicLinkCard
  PROPS: link: { id, title, url, emoji }

  // For now, link directly to URL. Task 3.3 will change to /go/:linkId
  href = link.url

  RENDER:
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block w-full"
    >
      // Shadow layer (expands on hover)
      <div className="absolute inset-0 bg-dark rounded translate-x-1.5 translate-y-1.5
        transition-transform group-hover:translate-x-2 group-hover:translate-y-2" />

      // Card face (lifts on hover)
      <div className="relative z-10 bg-white border-[3px] border-dark rounded p-4
        flex items-center justify-center gap-3
        transition-transform group-hover:-translate-y-0.5 group-hover:-translate-x-0.5">

        IF link.emoji THEN <span className="text-xl">{link.emoji}</span>
        <span className="font-bold text-lg">{link.title}</span>
      </div>
    </a>
```

---

### `app/components/public/PublicNotFound.tsx`
**Objective:** Render a styled 404 page that invites visitors to create their own biolink. Neo-Brutal design with CTA.

**Pseudocode:**
```pseudocode
COMPONENT PublicNotFound
  t = useTranslation()

  RENDER:
    <main className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">

        // Large 404 indicator (Neo-Brutal style)
        <div className="text-8xl font-black mb-4">404</div>

        // Message
        <h1 className="text-2xl font-bold mb-2">{t('public_not_found_title')}</h1>
        <p className="text-gray-600 mb-8">{t('public_not_found_description')}</p>

        // CTA to create biolink
        <div className="relative group inline-block">
          // Shadow layer
          <div className="absolute inset-0 bg-dark rounded translate-x-1 translate-y-1" />

          <Link
            to="/"
            className="relative z-10 inline-flex items-center justify-center
              px-6 py-3 bg-primary text-dark font-bold border-[3px] border-dark rounded
              group-hover:-translate-y-px group-hover:-translate-x-px
              transition-transform"
          >
            {t('public_not_found_cta')}
          </Link>
        </div>
      </div>
    </main>
```

---

### `app/components/public/Watermark.tsx`
**Objective:** Floating badge in bottom-right corner for free users. Styled with Neo-Brutal aesthetics.

**Pseudocode:**
```pseudocode
COMPONENT Watermark
  RENDER:
    <div className="fixed bottom-4 right-4 z-40">
      <a
        href="https://biolinq.page"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5
          bg-dark text-white text-xs font-mono
          border-[2px] border-dark rounded-full
          shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]
          hover:bg-gray-800 transition-colors"
      >
        <span>Powered by</span>
        <span className="font-bold text-primary">BioLinq</span>
      </a>
    </div>
```

---

## 4. I18N

### Existing keys to reuse
| Key | Usage |
|-----|-------|
| `dashboard_preview_no_links` | For empty state (if no links) - but we'll create a new public-specific key |

### New keys to create
| Key | English | Spanish |
|-----|---------|---------|
| `public_not_found_title` | Profile not found | Perfil no encontrado |
| `public_not_found_description` | This username doesn't exist yet. Want to claim it? | Este usuario no existe todavía. ¿Quieres reclamarlo? |
| `public_not_found_cta` | Create your BioLink | Crea tu BioLink |
| `public_no_links` | No links yet | Aún no hay enlaces |

---

## 5. E2E Test Plan

### Test 1: Public page renders correctly with user data
- **Preconditions:**
  - User exists with username "testuser"
  - User has a biolink with 2 links
- **Steps:**
  1. Navigate to `/testuser`
  2. Wait for page to load
- **Expected:**
  - Page shows user's avatar (or fallback)
  - Page shows user's display name
  - Page shows @testuser badge
  - Page shows 2 link cards with correct titles
  - Links are clickable and open in new tab

### Test 2: Public page shows 404 for non-existent username
- **Preconditions:** Username "nonexistent123" does not exist in database
- **Steps:**
  1. Navigate to `/nonexistent123`
- **Expected:**
  - Page shows 404 styled component
  - Shows "Profile not found" message
  - Shows "Create your BioLink" CTA button
  - CTA button links to home page

### Test 3: Watermark shown for free users
- **Preconditions:**
  - User "freeuser" exists with `isPremium: false`
  - User has a biolink
- **Steps:**
  1. Navigate to `/freeuser`
- **Expected:**
  - "Powered by BioLinq" badge visible in bottom-right corner
  - Badge is clickable and links to biolinq.page

### Test 4: Watermark hidden for premium users
- **Preconditions:**
  - User "premiumuser" exists with `isPremium: true`
  - User has a biolink
- **Steps:**
  1. Navigate to `/premiumuser`
- **Expected:**
  - No "Powered by BioLinq" badge visible
  - Profile renders normally

### Test 5: Empty links state renders correctly
- **Preconditions:**
  - User "emptyuser" exists with a biolink
  - Biolink has 0 links
- **Steps:**
  1. Navigate to `/emptyuser`
- **Expected:**
  - Avatar and name shown
  - "No links yet" message displayed
  - No link cards rendered

### Test 6: SEO meta tags are present
- **Preconditions:**
  - User "seouser" exists with name "John Doe" and avatar
  - User has a biolink
- **Steps:**
  1. Navigate to `/seouser`
  2. Inspect document head
- **Expected:**
  - `<title>` contains "John Doe | BioLinq"
  - `og:title` meta tag present with "John Doe"
  - `og:image` meta tag present with avatar URL
  - `twitter:card` meta tag present with "summary"
  - Canonical link present with full URL

---

## Implementation Notes

### Route Order
The `:username` route MUST be registered LAST in `app/routes.ts` to prevent it from catching specific routes like `/dashboard` or `/auth/login`.

### Link Tracking
In this task (3.1), links point directly to their target URL. Task 3.3 will implement click tracking by changing links to point to `/go/:linkId` which redirects and increments counters.

### View Tracking
View tracking (incrementing `totalViews`) is NOT part of this task. It will be implemented in Task 3.4.

### Theme Support
The page uses a fixed "brutalist" theme (bg-canvas, border-dark, etc.). Theme switching based on `biolink.theme` will be implemented in Phase 4.
