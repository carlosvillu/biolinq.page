import { z } from 'zod'

// Regex para detectar emojis Unicode
const EMOJI_REGEX = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u

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
