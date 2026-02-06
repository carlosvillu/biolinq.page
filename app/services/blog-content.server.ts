import fs from 'node:fs'
import path from 'node:path'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'
import { z } from 'zod'
import type { Locale } from '~/lib/i18n'

// --- Types ---
export type BlogPostMeta = {
  title: string
  slug: string
  canonicalSlug: string
  description: string
  date: string
  updatedDate?: string
  author: string
  tags: string[]
  coverImage: string
  coverAlt: string
  readingTime: number
}

export type BlogPost = {
  html: string
  meta: BlogPostMeta
}

// --- Zod Schema ---
const blogFrontmatterSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  canonicalSlug: z.string().min(1),
  description: z.string().max(160),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  updatedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  author: z.string().min(1),
  tags: z.array(z.string()).min(1),
  coverImage: z.string().min(1),
  coverAlt: z.string().min(1),
  readingTime: z.number().int().positive(),
})

// --- Internal helpers ---

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function parseFrontmatter(fileContent: string): {
  frontmatter: Record<string, unknown>
  body: string
} {
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) {
    return { frontmatter: {}, body: fileContent }
  }

  const rawFrontmatter = match[1]
  const body = match[2]
  const frontmatter: Record<string, unknown> = {}

  for (const line of rawFrontmatter.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || !trimmed.includes(':')) continue

    const colonIndex = trimmed.indexOf(':')
    const key = trimmed.slice(0, colonIndex).trim()
    let value: string | string[] | number = trimmed.slice(colonIndex + 1).trim()

    // Handle arrays: [item1, item2]
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1)
      frontmatter[key] = inner
        .split(',')
        .map((item) => item.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
      continue
    }

    // Handle quoted strings
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    // Handle numbers
    const num = Number(value)
    if (!isNaN(num) && value !== '') {
      frontmatter[key] = num
      continue
    }

    frontmatter[key] = value
  }

  return { frontmatter, body }
}

function resolveFilePath(slug: string, locale: Locale): string | null {
  const baseDir = path.join(process.cwd(), 'content', 'blog')

  // 1. Try locale-specific path
  const localePath = path.join(baseDir, locale, `${slug}.md`)
  if (fs.existsSync(localePath)) return localePath

  // 2. Fallback to English
  if (locale !== 'en') {
    const enPath = path.join(baseDir, 'en', `${slug}.md`)
    if (fs.existsSync(enPath)) return enPath
  }

  // 3. Try test seed posts (only in test environment)
  if (process.env.DB_TEST_URL) {
    const testLocalePath = path.join(baseDir, '__test__', locale, `${slug}.md`)
    if (fs.existsSync(testLocalePath)) return testLocalePath

    if (locale !== 'en') {
      const testEnPath = path.join(baseDir, '__test__', 'en', `${slug}.md`)
      if (fs.existsSync(testEnPath)) return testEnPath
    }
  }

  return null
}

function parseAndSanitizeHtml(markdownBody: string): string {
  const rawHtml = marked.parse(markdownBody) as string

  return sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'img',
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    },
  })
}

// --- Public API ---

export function getBlogPost(slug: string, locale: Locale): BlogPost | null {
  // Validate slug to prevent path traversal
  if (!SLUG_REGEX.test(slug)) {
    return null
  }

  const filePath = resolveFilePath(slug, locale)
  if (!filePath) return null

  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const { frontmatter, body } = parseFrontmatter(fileContent)

  const result = blogFrontmatterSchema.safeParse(frontmatter)
  if (!result.success) {
    throw new Error(
      `Invalid frontmatter in ${slug}: ${result.error.issues.map((i) => i.message).join(', ')}`
    )
  }

  const html = parseAndSanitizeHtml(body)

  return { html, meta: result.data }
}

function listMarkdownFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return []
  return fs.readdirSync(dirPath).filter((f) => f.endsWith('.md'))
}

export function getAllBlogPosts(locale: Locale): BlogPostMeta[] {
  const baseDir = path.join(process.cwd(), 'content', 'blog')
  const results: BlogPostMeta[] = []

  // Determine locale directory (with fallback to 'en')
  let localeDir = path.join(baseDir, locale)
  if (!fs.existsSync(localeDir)) {
    localeDir = path.join(baseDir, 'en')
  }

  // Collect files from main directory
  const files = listMarkdownFiles(localeDir)

  // Collect test seed files if in test environment
  if (process.env.DB_TEST_URL) {
    let testLocaleDir = path.join(baseDir, '__test__', locale)
    if (!fs.existsSync(testLocaleDir)) {
      testLocaleDir = path.join(baseDir, '__test__', 'en')
    }
    const testFiles = listMarkdownFiles(testLocaleDir)
    for (const file of testFiles) {
      const fullPath = path.join(testLocaleDir, file)
      processFile(fullPath, results)
    }
  }

  // Process main files
  for (const file of files) {
    const fullPath = path.join(localeDir, file)
    processFile(fullPath, results)
  }

  // Sort by date descending
  results.sort((a, b) => b.date.localeCompare(a.date))

  return results
}

function processFile(fullPath: string, results: BlogPostMeta[]): void {
  const content = fs.readFileSync(fullPath, 'utf-8')
  const { frontmatter } = parseFrontmatter(content)
  const parsed = blogFrontmatterSchema.safeParse(frontmatter)
  if (parsed.success) {
    results.push(parsed.data)
  }
}

export function getRelatedPosts(
  currentSlug: string,
  tags: string[],
  locale: Locale,
  limit: number = 3
): BlogPostMeta[] {
  const allPosts = getAllBlogPosts(locale)

  const scored = allPosts
    .filter((post) => post.slug !== currentSlug)
    .map((post) => {
      const sharedTags = post.tags.filter((tag) => tags.includes(tag))
      return { post, score: sharedTags.length }
    })
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map((s) => s.post)
}
