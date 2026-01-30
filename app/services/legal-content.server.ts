import fs from 'node:fs'
import path from 'node:path'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

export type LegalContent = {
  html: string // HTML sanitizado del contenido
  title: string // Extraído del primer <h1>
  description: string // Extraído del primer <p>
}

export type LegalPage = 'terms' | 'privacy' | 'cookies'
export type Locale = 'en' | 'es'

// Valid legal page values for security validation
const VALID_PAGES: LegalPage[] = ['terms', 'privacy', 'cookies']
const VALID_LOCALES: Locale[] = ['en', 'es']

/**
 * Carga, parsea y procesa contenido legal desde archivos Markdown.
 *
 * @param page - Tipo de página legal ('terms', 'privacy', 'cookies')
 * @param locale - Idioma solicitado ('en', 'es')
 * @returns Objeto con HTML sanitizado, título y descripción
 * @throws Error si no se encuentra el archivo para la página solicitada
 */
export function getLegalContent(page: LegalPage, locale: Locale): LegalContent {
  // 0. Validate inputs to prevent path traversal attacks
  if (!VALID_PAGES.includes(page)) {
    throw new Error(`Invalid legal page: ${page}`)
  }
  if (!VALID_LOCALES.includes(locale)) {
    // Fallback to 'en' for unsupported locales instead of throwing
    locale = 'en'
  }

  // 1. Construct file path
  const baseDir = path.join(process.cwd(), 'content', 'legal')
  let filePath = path.join(baseDir, locale, `${page}.md`)

  // 2. Check if file exists, fallback to English
  if (!fs.existsSync(filePath)) {
    filePath = path.join(baseDir, 'en', `${page}.md`)

    if (!fs.existsSync(filePath)) {
      throw new Error(`Legal content not found: ${page}`)
    }
  }

  // 3. Read file content
  const markdownContent = fs.readFileSync(filePath, 'utf-8')

  // 4. Parse Markdown to HTML
  const rawHtml = marked.parse(markdownContent) as string

  // 5. Sanitize HTML
  const sanitizedHtml = sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ['href', 'name', 'target', 'rel']
    }
  })

  // 6. Extract title from first <h1>
  const titleMatch = sanitizedHtml.match(/<h1[^>]*>(.*?)<\/h1>/)
  const title = titleMatch ? titleMatch[1].trim() : 'Legal Information'

  // 7. Extract description from first <p>
  const descriptionMatch = sanitizedHtml.match(/<p[^>]*>(.*?)<\/p>/)
  const description = descriptionMatch
    ? descriptionMatch[1].trim().substring(0, 160) + '...'
    : ''

  // 8. Remove the h1 from HTML (since LegalPageLayout renders its own h1)
  const htmlWithoutH1 = sanitizedHtml.replace(/<h1[^>]*>.*?<\/h1>/i, '')

  // 9. Return structured content
  return {
    html: htmlWithoutH1,
    title,
    description
  }
}
