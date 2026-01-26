import { z } from 'zod'

// Regex para detectar emojis Unicode
const EMOJI_REGEX = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u

/**
 * Sanitize a URL for safe rendering in href attributes.
 * Only allows https: protocol to prevent XSS via javascript:, data:, etc.
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '#'
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:') {
      return url
    }
    return '#'
  } catch {
    return '#'
  }
}

/**
 * Sanitize an image URL for safe rendering in src attributes.
 * Only allows https: protocol to prevent XSS via data:, javascript:, etc.
 */
export function sanitizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:') {
      return url
    }
    return null
  } catch {
    return null
  }
}

export const urlSchema = z
  .string()
  .transform((url) => {
    if (!url.startsWith('https://')) {
      return `https://${url}`
    }
    return url
  })
  .refine(
    (url) => {
      try {
        const parsed = new URL(url)
        return parsed.protocol === 'https:'
      } catch {
        return false
      }
    },
    { message: 'Please enter a valid HTTPS URL' }
  )

export const emojiSchema = z
  .string()
  .nullable()
  .refine((emoji) => {
    if (emoji === null || emoji === '') return true
    return EMOJI_REGEX.test(emoji)
  }, 'Please enter a valid emoji')

export const createLinkSchema = z.object({
  emoji: emojiSchema.optional(),
  title: z.string().min(1).max(50),
  url: urlSchema,
})

export type CreateLinkInput = z.infer<typeof createLinkSchema>
