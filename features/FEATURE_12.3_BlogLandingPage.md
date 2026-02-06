# FEATURE_12.3_BlogLandingPage

## 1. Natural Language Description

**Current state:** The blog content service (`app/services/blog-content.server.ts`) is fully implemented (Task 12.1) and real blog posts exist in `content/blog/en/` and `content/blog/es/` (Task 12.2). There is no route or UI to browse blog posts — the content is only accessible via the test API route (`api/__test__/blog`).

**Expected end state:** A public blog landing page at `/blog` that:

- Lists all blog posts as Neo-Brutal styled cards (cover image, title, description, date, reading time, tags)
- Detects locale from cookie/Accept-Language and shows posts in the correct language
- Includes full SEO meta tags (Open Graph, Twitter Card, canonical, locale alternates)
- Sets cache headers for performance (`public, max-age=1800, s-maxage=3600`)
- Has a blog header section with title and description
- Each card links to `/blog/{slug}` (route created in Task 12.4)
- Follows Neo-Brutal design system consistent with the rest of the site
- Uses the global layout from `root.tsx` (Header + Footer)

## 2. Technical Description

- **Route:** `app/routes/blog.index.tsx` registered as `/blog` in `app/routes.ts`
- **Loader:** Detects locale via `parseLangCookie` + `detectLocale` (same pattern as `legal.terms.tsx`), calls `getAllBlogPosts(locale)`, returns posts metadata with cache headers
- **Meta:** Full SEO with OG, Twitter Card, canonical, `og:locale` + `og:locale:alternate`
- **Components:** Two new components — `BlogHeader.tsx` (title + description) and `BlogPostCard.tsx` (individual post card)
- **Layout:** Uses the default `root.tsx` layout (Header + Footer are provided globally). No `hideLayout` needed.
- **i18n:** New keys for blog landing texts (title, description, reading time label, etc.)
- **Route placement:** Must be registered **before** the `:username` catch-all route in `app/routes.ts`

### 2.1. Architecture Gate

- **Pages are puzzles:** `blog.index.tsx` composes `BlogHeader` and `BlogPostCard` components. Minimal UI in the route module — just layout composition.
- **Loaders/actions are thin:** Loader parses `request` for locale detection, calls `getAllBlogPosts(locale)` service, returns data. No domain logic inline.
- **Business logic is not in components:**
  - Blog post retrieval lives in `app/services/blog-content.server.ts` (already exists).
  - `BlogHeader` is purely presentational (title + description).
  - `BlogPostCard` is purely presentational (renders post metadata as a card).
  - No hooks needed — this is a static listing page with no client-side interactivity.

**Route module `blog.index.tsx`:**
- **Loader:** calls `getAllBlogPosts` from `blog-content.server.ts`
- **Components composed:** `BlogHeader`, `BlogPostCard` (mapped over posts array)

**Component `BlogHeader`:**
- Hooks: `useTranslation` (for i18n texts)
- No business logic — purely renders title and description

**Component `BlogPostCard`:**
- Hooks: `useTranslation` (for "min read" label)
- No business logic — renders post metadata as a Neo-Brutal card with link to `/blog/{slug}`

## 3. Files to Change/Create

### `app/routes/blog.index.tsx` (CREATE)

**Objective:** Blog landing page route. Fetches all blog posts for the detected locale and renders them as a grid of cards.

**Pseudocode:**

```pseudocode
// --- loader ---
FUNCTION loader(request)
  cookieHeader = request.headers.get('Cookie')
  langCookie = parseLangCookie(cookieHeader)
  locale = detectLocale(request, langCookie)
  posts = getAllBlogPosts(locale)
  RETURN json({ posts, locale }) WITH headers:
    'Cache-Control': 'public, max-age=1800, s-maxage=3600'
END

// --- meta ---
FUNCTION meta({ data })
  IF not data THEN return [{ title: 'Blog - BioLinq' }]

  title = 'Blog - BioLinq'
  description = SEO description for blog landing (from i18n or hardcoded EN/ES)
  url = 'https://biolinq.page/blog'

  RETURN [
    { title },
    { name: 'description', content: description },
    // Open Graph
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: url },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:locale', content: locale === 'es' ? 'es_ES' : 'en_US' },
    { property: 'og:locale:alternate', content: locale === 'es' ? 'en_US' : 'es_ES' },
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    // Canonical
    { tagName: 'link', rel: 'canonical', href: url },
  ]
END

// --- component ---
FUNCTION BlogIndexPage
  { posts, locale } = useLoaderData()
  RENDER:
    <BlogHeader />
    <section> grid of posts.map(post => <BlogPostCard post={post} />) </section>
    IF posts.length === 0 THEN show empty state message
END
```

### `app/components/blog/BlogHeader.tsx` (CREATE)

**Objective:** Blog landing header with title and short description. Neo-Brutal styling consistent with the landing page.

**Pseudocode:**

```pseudocode
COMPONENT BlogHeader
  HOOKS: useTranslation()
  PROPS: none
  RENDER:
    <header> with bg-neo-panel, border-b-[3px] border-neo-dark
      <div> max-w-4xl mx-auto, padding
        <h1> font-bold text-4xl md:text-5xl tracking-tighter
          t('blog_title')  // "Blog"
        </h1>
        <p> text-xl text-neo-dark/80 mt-4
          t('blog_description')  // "Tips, guides, and insights..."
        </p>
      </div>
    </header>
END
```

### `app/components/blog/BlogPostCard.tsx` (CREATE)

**Objective:** Individual blog post card for the listing. Shows cover image, title, description, date, reading time, and tags as badges. Links to `/blog/{slug}`. Neo-Brutal design with hover lift effect.

**Pseudocode:**

```pseudocode
COMPONENT BlogPostCard
  HOOKS: useTranslation()
  PROPS: post (BlogPostMeta)
  RENDER:
    <Link to={`/blog/${post.slug}`}> block, group
      <div> relative (shadow wrapper)
        // Shadow Layer
        <div> absolute inset-0 bg-neo-dark rounded-xl translate-x-2 translate-y-2
              transition-transform group-hover:translate-x-2.5 group-hover:translate-y-2.5
        // Card Face
        <div> relative z-10 border-[3px] border-neo-dark rounded-xl bg-white overflow-hidden
              group-hover:-translate-y-0.5 group-hover:-translate-x-0.5 transition-transform

          // Cover Image (if exists)
          IF post.coverImage THEN
            <div> aspect-video overflow-hidden border-b-[3px] border-neo-dark
              <img src={post.coverImage} alt={post.coverAlt}
                   class="w-full h-full object-cover" loading="lazy" />
            </div>

          // Content
          <div> p-5 md:p-6
            // Tags as badges
            <div> flex flex-wrap gap-2 mb-3
              FOR tag IN post.tags
                <span> font-mono text-xs font-bold px-2 py-0.5
                       bg-neo-input border-2 border-neo-dark rounded
                  tag.toUpperCase()

            // Title
            <h2> font-bold text-xl mb-2 text-neo-dark
              post.title

            // Description
            <p> text-neo-dark/80 text-sm mb-4 line-clamp-2
              post.description

            // Meta: date + reading time
            <div> flex items-center gap-3 text-xs font-mono text-neo-dark/60
              <time> formatted date (post.date)
              <span> "•"
              <span> post.readingTime + " " + t('blog_min_read')
END
```

### `app/routes.ts` (MODIFY)

**Objective:** Register the `/blog` route. Must be placed before the `:username` catch-all route.

**Pseudocode:**

```pseudocode
// Add before the ':username' catch-all route:
route('blog', 'routes/blog.index.tsx'),
```

### `app/locales/en.json` (MODIFY)

**Objective:** Add i18n keys for blog landing page texts.

### `app/locales/es.json` (MODIFY)

**Objective:** Add Spanish translations for blog landing page texts.

## 4. I18N

### Existing keys to reuse

None — no existing blog-related keys.

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `blog_title` | Blog | Blog |
| `blog_description` | Tips, guides, and insights about building your online presence. | Consejos, guías e ideas para construir tu presencia online. |
| `blog_min_read` | min read | min de lectura |
| `blog_empty` | No posts yet. Check back soon! | Aún no hay posts. ¡Vuelve pronto! |
| `blog_meta_description` | Read the latest tips and guides on link in bio pages, personal branding, and growing your online presence with BioLinq. | Lee los últimos consejos y guías sobre páginas de link in bio, marca personal y cómo hacer crecer tu presencia online con BioLinq. |

## 5. E2E Test Plan

### Test: Blog landing renders with post cards

- **Preconditions:** Test seed posts exist in `content/blog/__test__/en/` (already created in Task 12.1). App server running with `DB_TEST_URL` set.
- **Steps:**
  1. Navigate to `/blog`
  2. Wait for page to load
- **Expected:**
  - Page title contains "Blog"
  - Blog header is visible with title text
  - At least one blog post card is visible
  - Each card shows title, description, and reading time
  - Each card is a link to `/blog/{slug}`

### Test: Blog landing shows correct language content

- **Preconditions:** Test seed posts exist in both `content/blog/__test__/en/` and `content/blog/__test__/es/`. App server running.
- **Steps:**
  1. Set language cookie to `es` (via `context.addInitScript` or cookie manipulation)
  2. Navigate to `/blog`
  3. Wait for page to load
- **Expected:**
  - Blog header shows Spanish text (from `blog_title` / `blog_description` i18n keys)
  - Spanish seed post (`seed-post-alpha` with Spanish title) is visible
  - Reading time label shows "min de lectura"
