# FEATURE_12.7: Blog I18n URLs (`/blog/:lang/:slug`)

## 1. Natural Language Description

### Current State
Blog post URLs follow the pattern `/blog/:slug`. The slug is language-specific (e.g., EN: `what-is-link-in-bio`, ES: `que-es-link-in-bio`), but the language is detected implicitly from the `lang` cookie or `Accept-Language` header. There is no language segment in the URL.

When a user changes the language via the `LanguageSelector`, the cookie and i18next language update, but:
- On `/blog`, the page reloads with the same URL and the loader picks the new locale from the cookie — but the post card links still point to `/blog/{slug}` using the slug from the previous locale until the page is reloaded from the server.
- On `/blog/:slug`, the URL doesn't change at all. The user stays on the same slug, which may not exist in the new language (or worse, the fallback to English silently serves the wrong language content).

### Expected End State
- Blog URLs become `/blog/:lang/:slug` (e.g., `/blog/en/what-is-link-in-bio`, `/blog/es/que-es-link-in-bio`).
- On `/blog`, all post card links point to `/blog/{currentLang}/{slug}` using the current page language.
- When the user changes the language via the selector on `/blog`, the page re-renders and all card links update to the new language's slugs.
- When viewing a blog post at `/blog/:lang/:slug` and the user changes the language, the browser navigates to `/blog/{newLang}/{translatedSlug}` — the translated version of the same post.
- The `:lang` param in the URL takes precedence over the cookie for determining which language to render the blog content in.
- SEO: `hreflang` alternate links, canonical URLs, and sitemap entries all use the new `/blog/:lang/:slug` format.

---

## 2. Technical Description

### Approach
1. **Route changes**: Replace `blog/:slug` with `blog/:lang/:slug` and `blog` with `blog/:lang` in `app/routes.ts`.
2. **Blog content service**: Add a new function `getSlugForLocale(canonicalSlug, targetLocale)` that finds the translated slug for a given `canonicalSlug` and locale. This enables the language switcher to know where to navigate.
3. **Blog post loader**: Read `:lang` from params instead of cookie. Validate it's a supported locale. Pass `canonicalSlug` and available translations to the component so the language switcher can build the correct URL.
4. **Blog index loader**: Read `:lang` from the URL (new route: `/blog/:lang`). Validate it's a supported locale.
5. **LanguageSelector enhancement**: When on a blog post page, changing language navigates to the translated post URL instead of just changing the cookie. Use `useLocation` + `useNavigate` + route data to detect blog context and build the target URL.
6. **BlogPostCard**: Update link `to` prop to include the language prefix.
7. **Sitemap**: Update to generate URLs with `/blog/{lang}/{slug}` for both EN and ES versions.
8. **Meta/SEO**: Update canonical, hreflang, og:url to use the new URL format.

### Key Design Decisions
- The `:lang` URL param is the **source of truth** for blog content language, not the cookie.
- When navigating to a blog post, the cookie is still updated to match (so the rest of the site stays in sync).
- The `canonicalSlug` field in frontmatter is the bridge between translations. It's always the English slug.
- Test seed posts use the same slug for EN/ES (`seed-post-alpha`), so the redirect for those will point to the same slug in both languages — this is fine.

---

## 2.1. Architecture Gate

- **Pages are puzzles:** `blog.post.tsx` and `blog.index.tsx` compose `BlogPostLayout`, `BlogPostCard`, `RelatedPosts`, `BlogHeader` — no business logic in the route module.
- **Loaders/actions are thin:** Loaders parse `params.lang` + `params.slug`, call `getBlogPost()` / `getAllBlogPosts()` / `getSlugForLocale()`, and return data. No domain logic inline.
- **Business logic is not in components:**
  - Translation slug resolution lives in `app/services/blog-content.server.ts`.
  - Navigation logic for language switching on blog pages lives in a new hook `app/hooks/useBlogLanguageSwitch.ts`.
  - `LanguageSelector` consumes the hook and renders UI.

### Route modules:
- **`blog.index.tsx`**: loader calls `getAllBlogPosts(lang)`, returns posts + lang. Component composes `BlogHeader` + `BlogPostCard` grid.
- **`blog.post.tsx`**: loader calls `getBlogPost(slug, lang)`, `getRelatedPosts()`, `getTranslationSlugs(canonicalSlug)`. Component composes `BlogPostLayout` + `RelatedPosts`.

### Components:
- **`BlogPostCard`**: receives `lang` prop, renders link to `/blog/{lang}/{slug}`. No business logic.
- **`LanguageSelector`**: consumes `useBlogLanguageSwitch()` hook. When on blog, calls navigate instead of just changing cookie.
- **`RelatedPosts`**: passes `lang` to `BlogPostCard`.

### Hooks:
- **`useBlogLanguageSwitch`**: uses `useLocation`, `useMatches` to detect if on a blog post page. Exposes `getLanguageSwitchUrl(newLocale)` that returns the target URL for the new locale (using translation map from loader data). Returns `null` when not on a blog page (so `LanguageSelector` falls back to default behavior).

---

## 3. Files to Change/Create

### `app/routes.ts`
**Objective:** Update route registration to use `/blog/:lang` and `/blog/:lang/:slug`.

**Pseudocode:**
```pseudocode
REMOVE: route('blog', 'routes/blog.index.tsx')
REMOVE: route('blog/:slug', 'routes/blog.post.tsx')

ADD: route('blog/:lang', 'routes/blog.index.tsx')
ADD: route('blog/:lang/:slug', 'routes/blog.post.tsx')
```

---

### `app/routes/blog.index.tsx`
**Objective:** Read `:lang` from URL params instead of cookie. Validate locale. Return posts for that language.

**Pseudocode:**
```pseudocode
LOADER:
  INPUT: request, params
  PROCESS:
    lang = params.lang
    IF lang is not a valid locale → throw 404
    posts = getAllBlogPosts(lang)
  OUTPUT: data({ posts, locale: lang }, { headers: cache })

COMPONENT BlogIndexPage:
  USES: useLoaderData, useTranslation
  RENDERS: BlogHeader + grid of BlogPostCard (passing lang prop)
```

**Changes to meta function:**
- Update `og:url` to `https://biolinq.page/blog/${data.locale}`
- Update canonical to `https://biolinq.page/blog/${data.locale}`
- Add hreflang alternates for `/blog/en` and `/blog/es`

---

### `app/routes/blog.post.tsx`
**Objective:** Read `:lang` from URL params. Load post by slug+lang. Provide translation map for language switcher.

**Pseudocode:**
```pseudocode
LOADER:
  INPUT: request, params
  PROCESS:
    lang = params.lang
    slug = params.slug
    IF lang is not a valid locale → throw 404
    post = getBlogPost(slug, lang)
    IF !post → throw 404
    relatedPosts = getRelatedPosts(slug, post.meta.tags, lang, 3)
    translationSlugs = getTranslationSlugs(post.meta.canonicalSlug)
  OUTPUT: data({ post, relatedPosts, locale: lang, translationSlugs }, { headers: cache })

COMPONENT BlogPostPage:
  USES: useLoaderData
  RENDERS: BlogPostLayout + RelatedPosts (passing lang prop)
```

**Changes to meta function:**
- Update `og:url` to `https://biolinq.page/blog/${locale}/${post.meta.slug}`
- Update canonical to `https://biolinq.page/blog/en/${post.meta.canonicalSlug}`
- Update hreflang alternates: `href: https://biolinq.page/blog/{lang}/{translatedSlug}`
- Update Schema.org `mainEntityOfPage` URL

---

### `app/services/blog-content.server.ts`
**Objective:** Add `getTranslationSlugs(canonicalSlug)` function that returns a map of `{ en: slug, es: slug }` for all available translations.

**Pseudocode:**
```pseudocode
FUNCTION getTranslationSlugs(canonicalSlug: string): Record<Locale, string | null>
  INPUT: canonicalSlug (the English slug that links translations)
  PROCESS:
    result = { en: null, es: null }
    FOR EACH locale IN SUPPORTED_LOCALES:
      scan all .md files in content/blog/{locale}/
      (also __test__/{locale}/ if DB_TEST_URL is set)
      FOR EACH file:
        parse frontmatter
        IF frontmatter.canonicalSlug === canonicalSlug:
          result[locale] = frontmatter.slug
          BREAK
    RETURN result
  OUTPUT: Record<Locale, string | null>
```

---

### `app/hooks/useBlogLanguageSwitch.ts` (NEW)
**Objective:** Detect if on a blog page and provide URL builder for language switching.

**Pseudocode:**
```pseudocode
HOOK useBlogLanguageSwitch():
  USES: useLocation, useMatches
  PROCESS:
    matches = useMatches()
    blogPostMatch = find match where id contains 'blog.post'
    blogIndexMatch = find match where id contains 'blog.index'

    IF blogPostMatch:
      translationSlugs = blogPostMatch.data.translationSlugs
      RETURN {
        isBlogPage: true,
        getLanguageSwitchUrl: (newLocale) => {
          targetSlug = translationSlugs[newLocale]
          IF targetSlug: return `/blog/${newLocale}/${targetSlug}`
          ELSE: return `/blog/${newLocale}`  // fallback to blog index
        }
      }
    ELSE IF blogIndexMatch:
      RETURN {
        isBlogPage: true,
        getLanguageSwitchUrl: (newLocale) => `/blog/${newLocale}`
      }
    ELSE:
      RETURN { isBlogPage: false, getLanguageSwitchUrl: null }
```

---

### `app/components/LanguageSelector.tsx`
**Objective:** When on a blog page, navigate to the translated URL instead of just changing the cookie.

**Pseudocode:**
```pseudocode
COMPONENT LanguageSelector:
  USES: useTranslation, useAnalytics, useBlogLanguageSwitch, useNavigate
  PROCESS:
    { isBlogPage, getLanguageSwitchUrl } = useBlogLanguageSwitch()
    navigate = useNavigate()

    handleSelect(locale):
      changeLanguage(locale)  // always update cookie + i18next
      trackLanguageChanged(locale)
      IF isBlogPage AND getLanguageSwitchUrl:
        url = getLanguageSwitchUrl(locale)
        navigate(url)
  RENDERS: same menu UI as before
```

---

### `app/components/blog/BlogPostCard.tsx`
**Objective:** Accept `lang` prop and use it in the link URL.

**Pseudocode:**
```pseudocode
COMPONENT BlogPostCard:
  PROPS: { post: BlogPostMeta, lang: string }
  RENDERS: Link to={`/blog/${lang}/${post.slug}`}
  (rest unchanged)
```

---

### `app/components/blog/RelatedPosts.tsx`
**Objective:** Accept `lang` prop and pass it to `BlogPostCard`.

**Pseudocode:**
```pseudocode
COMPONENT RelatedPosts:
  PROPS: { posts: BlogPostMeta[], lang: string }
  RENDERS: BlogPostCard with lang={lang}
```

---

### `app/services/sitemap.server.ts`
**Objective:** Generate blog URLs with `/blog/{lang}/{slug}` for both EN and ES.

**Pseudocode:**
```pseudocode
FUNCTION generateSitemap:
  CHANGE blog landing URL from '/blog' to '/blog/en' and '/blog/es'
  FOR EACH locale IN ['en', 'es']:
    blogPosts = getAllBlogPosts(locale)
    FOR EACH post:
      ADD URL: /blog/{locale}/{post.slug}
```

---

### `app/routes/api.__test__.blog.tsx`
**Objective:** Add test endpoint for `getTranslationSlugs` function.

**Pseudocode:**
```pseudocode
ADD case 'getTranslationSlugs':
  canonicalSlug = url.searchParams.get('canonicalSlug')
  result = getTranslationSlugs(canonicalSlug)
  RETURN json(result)
```

---

## 4. I18N

### Existing keys to reuse
- `blog_title` - Blog landing page title
- `blog_description` - Blog landing description
- `blog_min_read` - Reading time label
- `blog_related_posts` - Related posts heading
- `blog_post_cta_text` - CTA text
- `blog_post_cta_button` - CTA button
- `blog_empty` - Empty blog message

### New keys to create
No new i18n keys needed. All existing blog keys are reused. The language is determined by the URL `:lang` param, not by new UI text.

---

## 5. E2E Test Plan

### Test: Blog landing `/blog/en` renders with English content
- **Preconditions:** None
- **Steps:** Navigate to `/blog/en`
- **Expected:** Blog header and post cards visible in English

### Test: Blog landing `/blog/es` shows Spanish content
- **Preconditions:** None
- **Steps:** Navigate to `/blog/es`
- **Expected:** Blog header shows Spanish text, post cards link to `/blog/es/{slug}`

### Test: Blog post card links include language prefix
- **Preconditions:** None
- **Steps:** Navigate to `/blog/en`, inspect post card links
- **Expected:** All links match `/blog/en/{slug}` pattern

### Test: Blog post renders at `/blog/en/:slug`
- **Preconditions:** None
- **Steps:** Navigate to `/blog/en/seed-post-alpha`
- **Expected:** Post renders with English content, correct title

### Test: Blog post renders at `/blog/es/:slug`
- **Preconditions:** None
- **Steps:** Navigate to `/blog/es/seed-post-alpha`
- **Expected:** Post renders with Spanish content, Spanish author name

### Test: Language switch on blog post navigates to translated URL
- **Preconditions:** On `/blog/en/seed-post-alpha`
- **Steps:** Change language to Spanish via selector
- **Expected:** URL changes to `/blog/es/seed-post-alpha`, content is in Spanish

### Test: Language switch on blog index navigates to `/blog/{newLang}`
- **Preconditions:** On `/blog/en`
- **Steps:** Change language to Spanish via selector
- **Expected:** URL changes to `/blog/es`, post cards show Spanish content

### Test: Blog post SEO meta tags use new URL format
- **Preconditions:** None
- **Steps:** Navigate to `/blog/en/seed-post-alpha`
- **Expected:** Canonical contains `/blog/en/seed-post-alpha`, hreflang alternates point to `/blog/en/...` and `/blog/es/...`

### Test: 404 for invalid language code
- **Preconditions:** None
- **Steps:** Navigate to `/blog/fr/seed-post-alpha`
- **Expected:** 404 response

### Test: 404 for non-existent post slug
- **Preconditions:** None
- **Steps:** Navigate to `/blog/en/this-post-does-not-exist`
- **Expected:** 404 response
