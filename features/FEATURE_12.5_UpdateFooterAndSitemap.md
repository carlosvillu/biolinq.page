# FEATURE_12.5_UpdateFooterAndSitemap

## 1. Natural Language Description

**Current state:** The Footer component (`app/components/landing/Footer.tsx`) shows three links: Terms, Privacy, and Cookies. The sitemap (`app/services/sitemap.server.ts`) includes static pages (`/`, `/terms`, `/privacy`, `/cookies`) and dynamic biolink pages (`/:username`), but has no blog URLs.

**Expected end state:** The Footer includes a fourth link to `/blog`. The sitemap includes the `/blog` landing page and all individual blog post URLs with proper `<lastmod>` and `<changefreq>` values.

## 2. Technical Description

Two small changes:

1. **Footer:** Add a "Blog" link to the existing footer links. Requires a new i18n key `footer_blog`.
2. **Sitemap service:** Import `getAllBlogPosts` from the blog content service, add `/blog` as a static page, and dynamically generate entries for each blog post URL (`/blog/{slug}`) using post metadata for `<lastmod>`.

No new routes, no new components, no new services. This is purely additive to existing files.

### 2.1. Architecture Gate

- **Pages are puzzles:** No route modules are modified (the sitemap route just calls `generateSitemap`, unchanged).
- **Loaders/actions are thin:** The sitemap route loader remains a single service call.
- **Business logic is not in components:** The blog post scanning logic already lives in `app/services/blog-content.server.ts`. The sitemap service calls it. The Footer is a pure presentational component.

## 3. Files to Change/Create

### `app/components/landing/Footer.tsx`

**Objective:** Add a "Blog" link alongside the existing Terms, Privacy, and Cookies links.

**Pseudocode:**

```pseudocode
// In the links <div>, add a new <Link> element:
EXISTING LINKS: Terms, Privacy, Cookies
ADD LINK: to="/blog", text=t('footer_blog')
// Place it BEFORE the legal links (Blog | Terms | Privacy | Cookies)
```

### `app/services/sitemap.server.ts`

**Objective:** Include `/blog` landing and all individual blog post URLs in the generated sitemap.

**Pseudocode:**

```pseudocode
IMPORT getAllBlogPosts FROM blog-content.server

// Add /blog to STATIC_PAGES
STATIC_PAGES ADD { loc: '/blog', priority: 0.7, changefreq: 'weekly' }

FUNCTION generateSitemap(baseUrl)
  // existing: fetch biolinks
  biolinksList = await getAllPublicBiolinks()

  // NEW: fetch all blog posts (use 'en' as canonical locale)
  blogPosts = getAllBlogPosts('en')

  // existing: build biolink dynamic pages
  dynamicBiolinkPages = biolinksList.map(...)

  // NEW: build blog post dynamic pages
  blogPages = blogPosts.map(post => {
    loc: '/blog/' + post.slug,
    priority: 0.5,
    changefreq: 'monthly',
    lastmod: post.updatedDate OR post.date
  })

  allUrls = [...STATIC_PAGES, ...dynamicBiolinkPages, ...blogPages]
  // rest unchanged
END
```

### `app/locales/en.json`

**Objective:** Add `footer_blog` i18n key.

### `app/locales/es.json`

**Objective:** Add `footer_blog` i18n key.

## 4. I18N

### Existing keys to reuse

- `footer_terms`, `footer_privacy`, `footer_cookies`, `footer_rights` (unchanged)

### New keys to create

| Key           | English | Spanish |
|---------------|---------|---------|
| `footer_blog` | Blog    | Blog    |

## 5. E2E Test Plan

### Test: Footer contains blog link

- **Preconditions:** None (public page)
- **Steps:**
  1. Navigate to `/`
  2. Locate the `<footer>` element
  3. Find a link with `href="/blog"`
- **Expected:** Link is visible and contains the text "Blog"

### Test: Sitemap includes blog URLs

- **Preconditions:** At least one blog post exists in `content/blog/en/` (seed post from Task 12.2 already exists)
- **Steps:**
  1. Fetch `/sitemap.xml`
  2. Parse the XML response
- **Expected:**
  - Contains `<url>` with `<loc>` ending in `/blog</loc>`
  - Contains `<url>` with `<loc>` ending in `/blog/what-is-link-in-bio</loc>` (or the seed post slug)
  - Blog landing has `<changefreq>weekly</changefreq>`
  - Blog post has `<changefreq>monthly</changefreq>`
