import { useState, useCallback } from 'react'
import { ALLOWED_EMOJIS, type AllowedEmoji } from '~/db/schema/feedback'

interface UseFeedbackReturn {
  isSubmitting: boolean
  error: string | null
  submitFeedback: (emoji: AllowedEmoji, text?: string) => Promise<boolean>
}

export function useFeedback(): UseFeedbackReturn {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitFeedback = useCallback(async (
    emoji: AllowedEmoji,
    text?: string
  ): Promise<boolean> => {
    setIsSubmitting(true)
    setError(null)

    try {
      if (!ALLOWED_EMOJIS.includes(emoji)) {
        setError('Invalid emoji')
        return false
      }

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emoji,
          text: text?.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'UNKNOWN_ERROR' }))
        setError(data.error || 'Failed to submit feedback')
        return false
      }

      return true
    } catch {
      setError('Failed to submit feedback. Please try again.')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  return {
    isSubmitting,
    error,
    submitFeedback,
  }
}
