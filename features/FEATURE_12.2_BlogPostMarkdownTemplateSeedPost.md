# FEATURE_12.2_BlogPostMarkdownTemplateSeedPost

## 1. Natural Language Description

**Current state:** The blog content service (`app/services/blog-content.server.ts`) is fully implemented (Task 12.1). It reads Markdown files from `content/blog/{locale}/{slug}.md`, parses YAML-like frontmatter, validates with Zod, and returns structured data. However, the `content/blog/en/` and `content/blog/es/` directories don't exist yet — only `content/blog/__test__/` exists with test seed posts. There is no real blog content.

**Expected end state:** Two new directories (`content/blog/en/`, `content/blog/es/`) with one real blog post each:

- `content/blog/en/what-is-link-in-bio.md` — SEO-optimized English article about "what is a link in bio"
- `content/blog/es/que-es-link-in-bio.md` — Matching Spanish translation with same `canonicalSlug`

The frontmatter format is already defined by the Zod schema in `blog-content.server.ts`. This task creates the first real content that the service can serve. A placeholder note for the cover image path is documented since no image asset pipeline exists yet.

## 2. Technical Description

This is a **content-only** task. No code changes, no new services, no routes, no components.

- **Frontmatter format:** Already defined by `blogFrontmatterSchema` in `app/services/blog-content.server.ts`. The seed posts in `content/blog/__test__/en/` serve as a working reference.
- **Key constraint:** The `canonicalSlug` field must be the same in both the English and Spanish versions — it's always the English slug (`what-is-link-in-bio`). The `slug` field can differ per locale (English: `what-is-link-in-bio`, Spanish: `que-es-link-in-bio`).
- **Content quality:** The posts should be genuine SEO content (not placeholder text). Target keyword: "link in bio". Include internal links to BioLinq (`/` for signup, features mentions). Use proper heading hierarchy (H2, H3). Include a CTA to create a BioLinq account.
- **Cover image:** Use path `/blog/covers/what-is-link-in-bio.webp`. The actual image file is NOT created in this task — document the expected path and dimensions in a comment or README note. The blog post page (Task 12.4) will handle missing images gracefully.
- **No new dependencies.**

### 2.1. Architecture Gate

- **Pages are puzzles:** N/A — no routes or pages created.
- **Loaders/actions are thin:** N/A — no loaders/actions.
- **Business logic is not in components:** N/A — no components. This task only creates static Markdown content files consumed by the existing `blog-content.server.ts` service.

## 3. Files to Create

### `content/blog/en/what-is-link-in-bio.md`

**Objective:** First real English blog post. SEO-optimized article targeting the keyword "link in bio". Must pass the existing `blogFrontmatterSchema` validation.

**Frontmatter:**

```yaml
---
title: "What Is a Link in Bio? The Complete Guide for 2026"
slug: "what-is-link-in-bio"
canonicalSlug: "what-is-link-in-bio"
description: "Learn what a link in bio is, why it matters for your online presence, and how to create one in seconds with BioLinq."
date: "2026-02-06"
author: "BioLinq Team"
tags: ["link-in-bio", "personal-branding", "social-media"]
coverImage: "/blog/covers/what-is-link-in-bio.webp"
coverAlt: "A smartphone showing a link in bio page with multiple social links"
readingTime: 5
---
```

**Content structure (H2/H3 hierarchy):**

```
## What Is a Link in Bio?
  - Definition, context (Instagram, TikTok, X limitation)

## Why Do You Need a Link in Bio Page?
  ### 1. One Link, All Your Content
  ### 2. Track What Works
  ### 3. Look Professional

## How to Create a Link in Bio Page with BioLinq
  ### Step 1: Claim Your Username
  ### Step 2: Add Your Links
  ### Step 3: Choose a Theme
  ### Step 4: Share Your Link

## What Makes BioLinq Different?
  - Speed (<500ms), simplicity, no bloat, affordable premium

## Start Building Your Link in Bio Today
  - CTA paragraph with link to BioLinq homepage
```

**Guidelines:**

- ~800-1000 words for a 5-minute read
- Natural keyword density for "link in bio" (target: 1-2% density)
- Internal links: link to `/` (homepage/signup CTA)
- External concept references (Instagram, TikTok, etc.) but no external links
- Conversational, direct tone matching BioLinq's brand voice

### `content/blog/es/que-es-link-in-bio.md`

**Objective:** Spanish translation of the English post. Same `canonicalSlug`, different `slug`.

**Frontmatter:**

```yaml
---
title: "¿Qué Es un Link in Bio? La Guía Completa para 2026"
slug: "que-es-link-in-bio"
canonicalSlug: "what-is-link-in-bio"
description: "Descubre qué es un link in bio, por qué es clave para tu presencia online y cómo crear uno en segundos con BioLinq."
date: "2026-02-06"
author: "BioLinq Team"
tags: ["link-in-bio", "personal-branding", "social-media"]
coverImage: "/blog/covers/what-is-link-in-bio.webp"
coverAlt: "Un smartphone mostrando una página de link in bio con múltiples enlaces sociales"
readingTime: 5
---
```

**Content:** Full Spanish translation of the English post. Same structure, same headings (translated), same CTA. Not a machine translation — natural Spanish with proper localization.

## 4. I18N

No i18n keys needed. This task creates static Markdown content files only. The blog content service already handles locale resolution. UI-facing i18n keys will be added in Tasks 12.3 and 12.4.

## 5. E2E Test Plan

No new E2E tests needed for this task. The existing blog content service tests (Task 12.1) already validate the service's ability to read, parse, and return blog posts. The real posts created here will be automatically served by the service once the blog routes exist (Tasks 12.3/12.4).

**Manual verification after implementation:**

- Confirm `content/blog/en/what-is-link-in-bio.md` passes `blogFrontmatterSchema` validation
- Confirm `content/blog/es/que-es-link-in-bio.md` passes `blogFrontmatterSchema` validation
- Confirm both posts share the same `canonicalSlug: "what-is-link-in-bio"`
- Confirm the English post has `slug: "what-is-link-in-bio"` and the Spanish post has `slug: "que-es-link-in-bio"`

## 6. Cover Image Note

The cover image path is `/blog/covers/what-is-link-in-bio.webp`. This file does **not** exist yet. Options for future tasks:

1. Create a real cover image (recommended: 1200×630px for OG compatibility)
2. Use a placeholder/generated image
3. Handle missing images gracefully in `BlogPostLayout.tsx` (Task 12.4)

The blog post page component (Task 12.4) should render gracefully if the cover image 404s.
