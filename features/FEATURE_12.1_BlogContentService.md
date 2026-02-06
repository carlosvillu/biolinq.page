# FEATURE_12.1_BlogContentService

## 1. Natural Language Description

**Current state:** The project has a legal content service (`app/services/legal-content.server.ts`) that reads Markdown files from `content/legal/{locale}/`, parses them with `marked`, sanitizes with `sanitize-html`, and returns structured HTML + metadata. There is no blog infrastructure.

**Expected end state:** A new `blog-content.server.ts` service that reads blog posts from `content/blog/{locale}/{slug}.md`, parses YAML frontmatter + Markdown body, validates frontmatter with Zod, and exposes three functions:

- `getBlogPost(slug, locale)` — returns a single post with parsed HTML + validated metadata
- `getAllBlogPosts(locale)` — returns all post metadata sorted by date descending (no body parsing)
- `getRelatedPosts(currentSlug, tags, locale, limit)` — returns posts sharing tags with the current post

This is a **service-only** task. No routes, no components, no UI. The service will be consumed by Tasks 12.3 (blog landing) and 12.4 (blog post page).

## 2. Technical Description

- Follow the same pattern as `legal-content.server.ts`: read files from disk, parse Markdown, sanitize HTML, return structured data.
- **Frontmatter parsing:** Use a simple regex-based YAML frontmatter extractor (no extra dependency). The frontmatter block is delimited by `---` at the start of the file. Parse key-value pairs manually or use a minimal approach. Validate the parsed object with Zod.
- **Markdown parsing:** Reuse `marked` (already installed).
- **HTML sanitization:** Reuse `sanitize-html` (already installed).
- **No new dependencies required.**
- Locale fallback: if `content/blog/{locale}/{slug}.md` doesn't exist, try `content/blog/en/{slug}.md`.
- `getAllBlogPosts` scans the directory with `fs.readdirSync`, reads only frontmatter (not full body), and returns sorted metadata.
- `getRelatedPosts` filters `getAllBlogPosts` results by tag intersection, excludes current post, and limits results.
- **Test-only seed posts:** 3-4 seed posts live in `content/blog/__test__/{locale}/`. The service includes these posts **only** when `process.env.DB_TEST_URL` is set (i.e., during E2E tests). In dev/prod they are completely invisible. This allows full E2E coverage of multi-post scenarios (sorting, related posts, tag filtering) without polluting real content.

### 2.1. Architecture Gate

- **Pages are puzzles:** N/A — this task creates no routes or pages.
- **Loaders/actions are thin:** N/A — no loaders/actions in this task.
- **Business logic is not in components:** All blog content logic lives in `app/services/blog-content.server.ts`. No components are created.

**Service:** `app/services/blog-content.server.ts`
- Inputs/outputs clearly defined per function.
- Error handling: throws descriptive errors for missing posts.
- No DB interaction — purely filesystem-based.

## 3. Files to Change/Create

### `app/services/blog-content.server.ts`
**Objective:** Blog content service with three public functions: `getBlogPost`, `getAllBlogPosts`, `getRelatedPosts`. Plus TypeScript types and Zod validation for frontmatter.

**Pseudocode:**
```pseudocode
// --- Types ---
TYPE BlogPostMeta
  title: string
  slug: string
  canonicalSlug: string
  description: string (max 160 chars)
  date: string (YYYY-MM-DD)
  updatedDate?: string (YYYY-MM-DD, optional)
  author: string
  tags: string[]
  coverImage: string
  coverAlt: string
  readingTime: number (minutes)
END

TYPE BlogPost
  html: string (sanitized HTML body)
  meta: BlogPostMeta
END

// --- Zod Schema ---
CONST blogFrontmatterSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  canonicalSlug: z.string().min(1),
  description: z.string().max(160),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  updatedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  author: z.string().min(1),
  tags: z.array(z.string()).min(1),
  coverImage: z.string().min(1),
  coverAlt: z.string().min(1),
  readingTime: z.number().int().positive(),
})

// --- Internal helpers ---

FUNCTION parseFrontmatter(fileContent: string): { frontmatter: Record<string, unknown>, body: string }
  // 1. Match content between first two "---" delimiters
  // 2. Parse YAML-like key: value pairs from frontmatter block
  //    - Handle string values (quoted and unquoted)
  //    - Handle arrays (YAML bracket syntax: [item1, item2])
  //    - Handle numbers
  //    - Handle optional fields
  // 3. Return { frontmatter object, remaining body string }
  // NOTE: Keep this simple — blog frontmatter is controlled by us, not user input.
  //       A simple line-by-line parser is sufficient. No need for a full YAML library.
END

FUNCTION resolveFilePath(slug: string, locale: Locale): string
  INPUT: slug, locale
  PROCESS:
    1. baseDir = path.join(process.cwd(), 'content', 'blog')
    2. filePath = path.join(baseDir, locale, `${slug}.md`)
    3. If file exists → return filePath
    4. If locale !== 'en' → try path.join(baseDir, 'en', `${slug}.md`)
    5. If English fallback exists → return it
    6. If process.env.DB_TEST_URL is set:
       a. Try path.join(baseDir, '__test__', locale, `${slug}.md`)
       b. Fallback to path.join(baseDir, '__test__', 'en', `${slug}.md`)
       c. If found → return it
    7. Return null (not found)
  OUTPUT: filePath or null
END

// --- Public API ---

FUNCTION getBlogPost(slug: string, locale: Locale): BlogPost | null
  INPUT: slug (URL slug), locale ('en' | 'es')
  PROCESS:
    1. Validate slug (alphanumeric + hyphens only, prevent path traversal)
    2. Resolve file path with locale fallback
    3. If not found → return null
    4. Read file content
    5. Parse frontmatter + body with parseFrontmatter()
    6. Validate frontmatter with blogFrontmatterSchema.safeParse()
    7. If validation fails → throw Error with details
    8. Parse body Markdown to HTML with marked.parse()
    9. Sanitize HTML with sanitize-html (same config as legal-content + img tag allowed)
    10. Return { html: sanitizedHtml, meta: validatedFrontmatter }
  OUTPUT: BlogPost object or null
END

FUNCTION getAllBlogPosts(locale: Locale): BlogPostMeta[]
  INPUT: locale ('en' | 'es')
  PROCESS:
    1. baseDir = path.join(process.cwd(), 'content', 'blog')
    2. localeDir = path.join(baseDir, locale)
    3. If localeDir doesn't exist → fallback to path.join(baseDir, 'en')
    4. If fallback doesn't exist → return []
    5. Read directory listing with fs.readdirSync()
    6. Filter for .md files only
    7. If process.env.DB_TEST_URL is set:
       a. Also read from content/blog/__test__/{locale}/ (test seed posts)
       b. Merge with main listing
    8. For each file:
       a. Read file content
       b. Parse frontmatter only (skip body for performance)
       c. Validate with blogFrontmatterSchema
       d. If valid → add to results array
       e. If invalid → skip (log warning in dev)
    9. Sort results by date descending (newest first)
    10. Return sorted BlogPostMeta[]
  OUTPUT: Array of BlogPostMeta sorted by date desc
END


FUNCTION getRelatedPosts(currentSlug: string, tags: string[], locale: Locale, limit: number = 3): BlogPostMeta[]
  INPUT: currentSlug, tags (from current post), locale, limit
  PROCESS:
    1. Call getAllBlogPosts(locale)
    2. Filter out post with slug === currentSlug
    3. Score remaining posts by number of shared tags
    4. Sort by score descending (most shared tags first)
    5. Return top `limit` posts
  OUTPUT: Array of BlogPostMeta (max `limit` items)
END
```

## 4. I18N

No i18n keys needed for this task. The service is backend-only and returns raw content from Markdown files. UI-facing i18n keys will be added in Tasks 12.3 and 12.4 when the blog routes and components are created.

## 5. Test Seed Posts

To enable full E2E coverage without polluting real blog content, **3-4 test-only seed posts** are created in `content/blog/__test__/{locale}/`. These are only visible when `DB_TEST_URL` is set (E2E test environment). They are **never served in dev or production**.

### Seed post structure: `content/blog/__test__/en/`

| File | Tags | Date | Purpose |
|------|------|------|---------|
| `seed-post-alpha.md` | `["link-in-bio", "personal-branding"]` | `2026-01-15` | Main test post, shared tags with beta |
| `seed-post-beta.md` | `["link-in-bio", "social-media"]` | `2026-01-20` | Related to alpha via `link-in-bio` tag |
| `seed-post-gamma.md` | `["seo", "marketing"]` | `2026-01-25` | No shared tags with alpha (tests no-match) |
| `seed-post-invalid.md` | _(missing required fields)_ | — | Tests frontmatter validation rejection |

### Seed post structure: `content/blog/__test__/es/`

| File | Purpose |
|------|---------|
| `seed-post-alpha.md` | Spanish version of alpha (same `canonicalSlug`) |

> Only alpha has a Spanish version. Beta and gamma are English-only, which tests the locale fallback path.

## 6. E2E Test Plan

Since this is a service-only task with no UI, we use the **test API route pattern** (documented in `docs/TESTING.md`) to expose the service for E2E testing.

### `app/routes/api.__test__.blog.tsx`
**Objective:** Test-only API route to expose blog content service functions. Returns 404 if `DB_TEST_URL` is not set.

**Pseudocode:**
```pseudocode
LOADER (GET):
  1. Guard: if !process.env.DB_TEST_URL → 404
  2. Read query params: action, slug, locale, tags, limit
  3. Switch on action:
     - "getPost": call getBlogPost(slug, locale) → return JSON
     - "getAll": call getAllBlogPosts(locale) → return JSON
     - "getRelated": call getRelatedPosts(slug, tags, locale, limit) → return JSON
     - default: 400 Bad Request
END
```

### Test: `getBlogPost` returns a valid blog post

- **Preconditions:** Test seed posts exist in `content/blog/__test__/en/`
- **Steps:** GET `/api/__test__/blog?action=getPost&slug=seed-post-alpha&locale=en`
- **Expected:** 200 with `{ html, meta }` where `meta.title` is non-empty, `html` contains sanitized HTML

### Test: `getBlogPost` returns null for non-existent slug

- **Preconditions:** No post with slug "non-existent-post"
- **Steps:** GET `/api/__test__/blog?action=getPost&slug=non-existent-post&locale=en`
- **Expected:** 200 with `null` response

### Test: `getBlogPost` falls back to English when locale file missing

- **Preconditions:** `seed-post-beta.md` exists only in `content/blog/__test__/en/`, not in `es/`
- **Steps:** GET `/api/__test__/blog?action=getPost&slug=seed-post-beta&locale=es`
- **Expected:** 200 with valid `{ html, meta }` (English content served as fallback)

### Test: `getBlogPost` returns Spanish version when available

- **Preconditions:** `seed-post-alpha.md` exists in both `content/blog/__test__/en/` and `content/blog/__test__/es/`
- **Steps:** GET `/api/__test__/blog?action=getPost&slug=seed-post-alpha&locale=es`
- **Expected:** 200 with `{ html, meta }` where content is in Spanish

### Test: `getAllBlogPosts` returns posts sorted by date descending

- **Preconditions:** 3 valid seed posts exist (alpha, beta, gamma)
- **Steps:** GET `/api/__test__/blog?action=getAll&locale=en`
- **Expected:** 200 with array of 3 `BlogPostMeta` objects, sorted: gamma (Jan 25) → beta (Jan 20) → alpha (Jan 15)

### Test: `getRelatedPosts` excludes current post and matches by tags

- **Preconditions:** alpha shares `link-in-bio` tag with beta; gamma has no shared tags
- **Steps:** GET `/api/__test__/blog?action=getRelated&slug=seed-post-alpha&tags=link-in-bio,personal-branding&locale=en&limit=3`
- **Expected:** 200 with array containing beta (shared `link-in-bio`), possibly gamma (no shared tags, lower score). Does NOT contain alpha.

### Test: Frontmatter validation rejects invalid posts

- **Preconditions:** `seed-post-invalid.md` exists with missing required frontmatter fields
- **Steps:** GET `/api/__test__/blog?action=getAll&locale=en`
- **Expected:** Array contains only 3 valid posts (alpha, beta, gamma). Invalid post is silently excluded.
