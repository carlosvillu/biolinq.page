# FEATURE_12.6_BlogAnalyticsIntegration.md

## 1. Natural Language Description

**Current state:** The blog pages (`/blog` landing and `/blog/:slug` post pages) render correctly with SEO, related posts, and CTA links, but no GA4 analytics events are tracked for blog-specific interactions. The analytics system already tracks events for other areas (links, themes, premium, profiles, etc.) via `app/lib/analytics-events.ts` and the `useAnalytics` hook.

**Expected end state:** Two new GA4 events are tracked:

1. **`blog_post_viewed`** — fires when a user views a blog post page (`/blog/:slug`), sending the post `slug` and `tags` as event parameters.
2. **`blog_cta_clicked`** — fires when a user clicks an internal CTA link within a blog post or the related-posts CTA button (links pointing to `/` or other internal BioLinq routes).

These events follow the existing pattern: functions in `analytics-events.ts`, re-exported via `useAnalytics`, consumed by components. An E2E test verifies the `blog_post_viewed` event fires (with consent accepted).

## 2. Technical Description

- Add two new event functions to `app/lib/analytics-events.ts` following the existing `gtagEvent` pattern.
- Re-export them from `app/hooks/useAnalytics.ts`.
- **`blog_post_viewed`**: Tracked in `BlogPostLayout.tsx` via a `useEffect` that fires once on mount with the post's `slug` and `tags`.
- **`blog_cta_clicked`**: Tracked in `RelatedPosts.tsx` on the CTA button click. For CTA links inside the rendered markdown (`.neo-article`), attach a delegated click listener in `BlogPostLayout.tsx` via `useEffect` that detects clicks on `<a>` tags with internal `href` (starting with `/`).

No new services, hooks, or routes are needed. No database changes.

## 2.1. Architecture Gate

- **Pages are puzzles:** `blog.post.tsx` route module remains unchanged — it only composes `BlogPostLayout` and `RelatedPosts`. No new UI or logic added to the route.
- **Loaders/actions are thin:** No loader/action changes.
- **Business logic is not in components:** The tracking functions are framework-agnostic in `analytics-events.ts`. Components only call them at the right moment (click handler, mount effect). No domain logic added to components.

## 3. Files to Change/Create

### `app/lib/analytics-events.ts`

**Objective:** Add `trackBlogPostViewed` and `trackBlogCTAClicked` event functions.

**Pseudocode:**

```pseudocode
FUNCTION trackBlogPostViewed(slug: string, tags: string[])
  CALL gtagEvent('blog_post_viewed', { slug, tags: tags.join(',') })
END

FUNCTION trackBlogCTAClicked(location: string)
  CALL gtagEvent('blog_cta_clicked', { location })
END
```

> Note: `tags` is sent as a comma-separated string because GA4 event parameters don't support arrays.

---

### `app/hooks/useAnalytics.ts`

**Objective:** Import and re-export the two new functions.

**Pseudocode:**

```pseudocode
IMPORT trackBlogPostViewed, trackBlogCTAClicked FROM analytics-events
ADD to useAnalytics return object
```

---

### `app/components/blog/BlogPostLayout.tsx`

**Objective:** Fire `blog_post_viewed` on mount. Attach delegated click listener for internal CTA links inside `.neo-article`.

**Pseudocode:**

```pseudocode
COMPONENT BlogPostLayout(html, meta)
  USE useAnalytics() -> { trackBlogPostViewed, trackBlogCTAClicked }

  EFFECT [meta.slug]:
    trackBlogPostViewed(meta.slug, meta.tags)
  END

  EFFECT [articleRef]:
    GET container = articleRef.current
    IF NOT container RETURN

    HANDLER onClick(event):
      target = event.target closest 'a[href^="/"]'
      IF target:
        trackBlogCTAClicked(target.getAttribute('href'))
    END

    container.addEventListener('click', onClick)
    RETURN () => container.removeEventListener('click', onClick)
  END

  // Existing render unchanged, add ref to .neo-article div
END
```

---

### `app/components/blog/RelatedPosts.tsx`

**Objective:** Fire `blog_cta_clicked` when user clicks the CTA button at the bottom.

**Pseudocode:**

```pseudocode
COMPONENT RelatedPosts(posts)
  USE useAnalytics() -> { trackBlogCTAClicked }

  HANDLER onCTAClick():
    trackBlogCTAClicked('blog_post_footer')
  END

  // Existing render unchanged, add onClick={onCTAClick} to CTA Link
END
```

---

## 4. I18N

No new i18n keys needed. This task only adds analytics tracking — no user-visible text changes.

## 5. E2E Test Plan

### Test: Blog post view triggers `blog_post_viewed` analytics event (with consent)

- **Preconditions:** Analytics consent accepted via `context.addInitScript` (localStorage `biolinq_analytics_consent` = `'accepted'`)
- **Steps:**
  1. Navigate to `/blog/seed-post-alpha`
  2. Wait for `networkidle`
  3. Read `window.dataLayer` entries, converting each to array via `Array.from()`
  4. Find an entry where `args[0] === 'event'` and `args[1] === 'blog_post_viewed'`
  5. Verify the event params contain `slug: 'seed-post-alpha'` and `tags` containing `'link-in-bio'`
- **Expected:** The `blog_post_viewed` event is found in `dataLayer` with correct slug and tags.

### Test file: `tests/e2e/blog-analytics.spec.ts`

Follows the same pattern as `google-analytics.spec.ts`:
- Import from `../fixtures/app.fixture`
- `beforeEach` sets consent via `context.addInitScript`
- Uses `page.evaluate` to inspect `window.dataLayer`

## 6. Documentation Updates

### `docs/ANALYTICS.md`

Add a new **Blog Events** section to the "Available Events" table:

| Function | Event Name | Parameters | When to Use |
|----------|------------|------------|-------------|
| `trackBlogPostViewed(slug, tags)` | `blog_post_viewed` | `{ slug, tags }` | On blog post page view |
| `trackBlogCTAClicked(location)` | `blog_cta_clicked` | `{ location }` | On internal CTA link click in blog |

Add to "Integration Points":
- `app/components/blog/BlogPostLayout.tsx` - blog post viewed, blog CTA clicked (in-content links)
- `app/components/blog/RelatedPosts.tsx` - blog CTA clicked (footer CTA)
