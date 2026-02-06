# FEATURE_12.4_BlogPostPage.md

## 1. Natural Language Description

**Current state:** The blog has a landing page at `/blog` that lists all posts as cards. Clicking a card links to `/blog/{slug}`, but that route does not exist yet — it results in a 404 (caught by the `/:username` dynamic route).

**Expected end state:** Each blog post has a dedicated page at `/blog/:slug` with:

- Full article content rendered from Markdown (using the existing `getBlogPost` service)
- Post header with title, date, author, reading time, and tags
- Prose-styled content area using the existing `.neo-article` CSS class
- Related posts section at the bottom (using the existing `getRelatedPosts` service)
- CTA to create a BioLinq account
- Full SEO: meta tags, Open Graph, Twitter Card, Schema.org JSON-LD, canonical, hreflang alternates, robots, cache headers
- 404 response for non-existent slugs

## 2. Technical Description

- **Route:** New route `/blog/:slug` registered in `app/routes.ts`, mapped to `app/routes/blog.post.tsx`
- **Loader:** Detects locale, calls `getBlogPost(slug, locale)`, returns 404 if null. Also calls `getRelatedPosts()` for the footer section. Returns cache headers `public, max-age=3600, s-maxage=86400`.
- **Meta function:** Generates full SEO tags from post metadata (title, description, OG, Twitter, article:published_time, article:tag, canonical pointing to English version via canonicalSlug, hreflang alternates, robots index/follow). Also injects Schema.org `BlogPosting` JSON-LD as a `<script>` tag.
- **Components:** Two new presentational components (`BlogPostLayout`, `RelatedPosts`) composed in the route module.
- **Styling:** Reuses the existing `.neo-article` CSS class (same as legal pages) for the Markdown content. Neo-Brutal design for the post header and related posts section.

### Dependencies

- `app/services/blog-content.server.ts` — already provides `getBlogPost`, `getRelatedPosts`, `BlogPost`, `BlogPostMeta`
- `.neo-article` CSS class — already defined in `app/app.css`
- `app/components/blog/BlogPostCard.tsx` — reused in the related posts section

## 2.1. Architecture Gate

- **Pages are puzzles:** `blog.post.tsx` route module composes `BlogPostLayout` and `RelatedPosts` components with minimal glue JSX. No business logic in the route component.
- **Loaders/actions are thin:** Loader parses `request` for locale, calls `getBlogPost` and `getRelatedPosts` services, returns data or throws 404.
- **Business logic is not in components:**
  - Content fetching and Markdown parsing live in `app/services/blog-content.server.ts` (already exists).
  - `BlogPostLayout` is purely presentational (renders HTML, header metadata).
  - `RelatedPosts` is purely presentational (renders a list of `BlogPostCard` components).

**Route module `blog.post.tsx`:**
- **Loader calls:** `getBlogPost(slug, locale)`, `getRelatedPosts(slug, tags, locale)`
- **Composes:** `BlogPostLayout`, `RelatedPosts`

**Component `BlogPostLayout`:**
- **Hooks:** `useTranslation` (for i18n labels)
- **Business logic NOT inside:** No data fetching, no Markdown parsing. Receives `html`, `meta` as props.

**Component `RelatedPosts`:**
- **Hooks:** `useTranslation` (for section title and CTA text)
- **Business logic NOT inside:** Receives `posts` array as props, renders `BlogPostCard` for each.

## 3. Files to Change/Create

### `app/routes.ts`

**Objective:** Register the new `/blog/:slug` route before the `/:username` catch-all.

**Pseudocode:**

```pseudocode
// Add after the blog index route and before the :username catch-all
route('blog/:slug', 'routes/blog.post.tsx')
```

### `app/routes/blog.post.tsx`

**Objective:** Route module for individual blog posts. Thin loader + meta + composition.

**Pseudocode:**

```pseudocode
LOADER(request, params):
  slug = params.slug
  locale = detectLocale(request, parseLangCookie(cookieHeader))
  post = getBlogPost(slug, locale)
  IF post is null:
    THROW 404 Response
  relatedPosts = getRelatedPosts(slug, post.meta.tags, locale, 3)
  RETURN data({ post, relatedPosts, locale }, headers: Cache-Control: public, max-age=3600, s-maxage=86400)

META(data):
  IF no data: return [{ title: 'Not Found - BioLinq' }]
  title = "{post.meta.title} - BioLinq Blog"
  description = post.meta.description
  url = "https://biolinq.page/blog/{post.meta.slug}"
  canonicalUrl = "https://biolinq.page/blog/{post.meta.canonicalSlug}"
  ogLocale = locale === 'es' ? 'es_ES' : 'en_US'
  ogLocaleAlt = locale === 'es' ? 'en_US' : 'es_ES'

  RETURN [
    { title },
    { name: 'description', content: description },
    { name: 'robots', content: 'index, follow' },
    // Open Graph
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: url },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: post.meta.coverImage },
    { property: 'og:locale', content: ogLocale },
    { property: 'og:locale:alternate', content: ogLocaleAlt },
    { property: 'article:published_time', content: post.meta.date },
    ...post.meta.tags.map(tag => { property: 'article:tag', content: tag }),
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: post.meta.coverImage },
    // Canonical + hreflang
    { tagName: 'link', rel: 'canonical', href: canonicalUrl },
    { tagName: 'link', rel: 'alternate', hreflang: 'en', href: "https://biolinq.page/blog/{post.meta.canonicalSlug}" },
    { tagName: 'link', rel: 'alternate', hreflang: 'es', href: "https://biolinq.page/blog/{post.meta.slug if locale=es, else canonicalSlug}" },
    // Schema.org JSON-LD as script tag
    { 'script:ld+json': BlogPosting structured data }
  ]

HEADERS:
  return loaderHeaders

COMPONENT BlogPostPage:
  { post, relatedPosts } = useLoaderData()
  RENDER:
    <BlogPostLayout html={post.html} meta={post.meta} />
    <RelatedPosts posts={relatedPosts} />
```

**Note on Schema.org JSON-LD:** React Router's `meta` function supports `script:ld+json` for structured data. The JSON-LD object will include:

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{title}",
  "description": "{description}",
  "image": "{coverImage}",
  "datePublished": "{date}",
  "dateModified": "{updatedDate || date}",
  "author": { "@type": "Person", "name": "{author}" },
  "publisher": { "@type": "Organization", "name": "BioLinq" },
  "mainEntityOfPage": { "@type": "WebPage", "@id": "{canonicalUrl}" }
}
```

### `app/components/blog/BlogPostLayout.tsx`

**Objective:** Presentational component for the blog post header + content area. Neo-Brutal design consistent with legal pages.

**Pseudocode:**

```pseudocode
COMPONENT BlogPostLayout
  PROPS: html (string), meta (BlogPostMeta)
  HOOKS: useTranslation()

  formattedDate = format meta.date as localized date string

  RENDER:
    // Post header section (bg-panel, border-b)
    <header className="bg-panel border-b-[3px] border-dark">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        // Tags as badges
        <div className="flex flex-wrap gap-2 mb-4">
          FOR each tag in meta.tags:
            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-input border-2 border-dark rounded">
              {tag.toUpperCase()}
            </span>
        </div>

        // Title
        <h1 className="font-bold text-3xl md:text-4xl tracking-tighter text-dark mb-4">
          {meta.title}
        </h1>

        // Meta line: author, date, reading time
        <div className="flex flex-wrap items-center gap-3 text-sm font-mono text-dark/60">
          <span>{meta.author}</span>
          <span>&bull;</span>
          <time dateTime={meta.date}>{formattedDate}</time>
          <span>&bull;</span>
          <span>{meta.readingTime} {t('blog_min_read')}</span>
        </div>
      </div>
    </header>

    // Content area (Neo-Brutal card, same pattern as LegalPageLayout)
    <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      <div className="relative">
        // Shadow Layer
        <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-xl bg-dark" />
        // Content Card
        <article className="relative z-10 rounded-xl border-[3px] border-dark bg-panel p-6 md:p-8">
          <div className="neo-article" dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      </div>
    </main>
```

### `app/components/blog/RelatedPosts.tsx`

**Objective:** Presentational section showing related posts and a CTA to create a BioLinq account.

**Pseudocode:**

```pseudocode
COMPONENT RelatedPosts
  PROPS: posts (BlogPostMeta[])
  HOOKS: useTranslation()

  IF posts.length === 0:
    RENDER only the CTA section (no related posts heading)

  RENDER:
    <section className="max-w-3xl mx-auto px-4 py-12">
      IF posts.length > 0:
        // Section title
        <h2 className="font-bold text-2xl tracking-tight text-dark mb-8">
          {t('blog_related_posts')}
        </h2>

        // Related post cards grid
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          FOR each post in posts:
            <BlogPostCard post={post} />
        </div>

      // CTA section
      <div className="text-center border-t-[3px] border-dark pt-8">
        <p className="text-lg text-dark/80 mb-4">{t('blog_post_cta_text')}</p>
        <Link to="/" className="inline-block">
          // Neo-Brutal button
          <div className="relative group cursor-pointer">
            <div className="absolute inset-0 bg-dark rounded translate-x-1 translate-y-1" />
            <div className="relative z-10 px-6 py-3 bg-primary text-dark font-bold border-[3px] border-dark rounded
              group-hover:-translate-y-px group-hover:-translate-x-px transition-transform duration-200">
              {t('blog_post_cta_button')}
            </div>
          </div>
        </Link>
      </div>
    </section>
```

## 4. I18N

### Existing keys to reuse

- `blog_min_read` — "min read" / "min de lectura"
- `blog_title` — "Blog" (for back link if needed)

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `blog_related_posts` | Related Posts | Posts Relacionados |
| `blog_post_cta_text` | Ready to build your own link in bio page? | ¿Listo para crear tu propia página de link in bio? |
| `blog_post_cta_button` | Create your free BioLinq → | Crea tu BioLinq gratis → |
| `blog_post_not_found` | Post not found | Post no encontrado |

## 5. E2E Test Plan

Test file: `tests/e2e/blog-post.spec.ts`

### Test: Blog post renders with correct content

- **Preconditions:** Test seed posts exist in `content/blog/__test__/en/`
- **Steps:**
  1. Navigate to `/blog/seed-post-alpha`
- **Expected:**
  - Page title contains "Alpha Post"
  - H1 heading with post title is visible
  - Author name "Test Author" is visible
  - Reading time "5 min read" is visible
  - Tags "LINK-IN-BIO" and "PERSONAL-BRANDING" are visible as badges
  - Article content contains "Introduction" heading (h2)
  - `.neo-article` container is present with rendered HTML

### Test: Blog post shows proper SEO meta tags

- **Preconditions:** Test seed posts exist
- **Steps:**
  1. Navigate to `/blog/seed-post-alpha`
- **Expected:**
  - `<title>` contains post title and "BioLinq Blog"
  - `<meta name="description">` matches post description
  - `<meta name="robots" content="index, follow">` is present
  - `<meta property="og:type" content="article">` is present
  - `<meta property="og:title">` contains post title
  - `<meta property="og:image">` is present
  - `<meta property="article:published_time">` matches post date
  - `<link rel="canonical">` points to canonicalSlug URL
  - `<script type="application/ld+json">` contains BlogPosting schema with correct headline

### Test: Related posts section renders

- **Preconditions:** Test seed posts exist (alpha shares tags with beta)
- **Steps:**
  1. Navigate to `/blog/seed-post-alpha`
- **Expected:**
  - "Related Posts" heading is visible
  - At least one related post card is visible (beta post shares "link-in-bio" tag)
  - Related post cards link to `/blog/{slug}`
  - CTA button "Create your free BioLinq" is visible and links to `/`

### Test: 404 for non-existent post slug

- **Preconditions:** None
- **Steps:**
  1. Navigate to `/blog/this-post-does-not-exist`
- **Expected:**
  - Response status is 404
  - Page does not render a blog post layout
