import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from '@base-ui/react/dialog'
import { NeoBrutalButton } from '~/components/neo-brutal/NeoBrutalButton'
import { useNeoBrutalToast } from '~/components/neo-brutal/NeoBrutalToast'
import { useAnalytics } from '~/hooks/useAnalytics'
import { useFeedback } from '~/hooks/useFeedback'
import { ALLOWED_EMOJIS, type AllowedEmoji } from '~/db/schema/feedback'

interface FeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const { t } = useTranslation()
  const [selectedEmoji, setSelectedEmoji] = useState<AllowedEmoji | null>(null)
  const [text, setText] = useState('')
  const { submitFeedback, isSubmitting, error } = useFeedback()
  const { trackFeedbackSubmitted } = useAnalytics()
  const toast = useNeoBrutalToast()

  const handleEmojiSelect = (emoji: AllowedEmoji) => {
    setSelectedEmoji(emoji)
  }

  const handleSubmit = async () => {
    if (!selectedEmoji) return

    const success = await submitFeedback(selectedEmoji, text)

    if (success) {
      trackFeedbackSubmitted(selectedEmoji, text.trim().length > 0)
      toast.add({
        title: t('feedback_success'),
        type: 'success',
      })
      setSelectedEmoji(null)
      setText('')
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    setSelectedEmoji(null)
    setText('')
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/50 z-40" />

        <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white border-[3px] border-neo-dark rounded-xl p-6 shadow-hard-lg z-50">
          <Dialog.Title className="text-xl font-bold mb-2">
            {t('feedback_modal_title')}
          </Dialog.Title>

          <Dialog.Description className="text-gray-600 mb-6">
            {t('feedback_modal_subtitle')}
          </Dialog.Description>

          <div className="space-y-6">
            {/* Emoji selection */}
            <div>
              <div className="flex justify-center gap-3">
                {ALLOWED_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className={`
                      w-12 h-12 text-2xl rounded-lg border-[3px] transition-all
                      ${
                        selectedEmoji === emoji
                          ? 'bg-neo-primary border-neo-dark scale-110'
                          : 'bg-white border-neo-dark hover:bg-neo-canvas'
                      }
                    `}
                    aria-pressed={selectedEmoji === emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {!selectedEmoji && error && (
                <p className="text-sm text-red-500 text-center mt-2">
                  {t('feedback_required_emoji')}
                </p>
              )}
            </div>

            {/* Textarea */}
            <div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('feedback_textarea_placeholder')}
                className="w-full h-32 p-3 bg-neo-input border-[3px] border-neo-dark rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-neo-primary"
              />
            </div>

            {/* Error message */}
            {error && <p className="text-sm text-red-500">{t('feedback_error')}</p>}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <NeoBrutalButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                {t('feedback_cancel')}
              </NeoBrutalButton>

              <NeoBrutalButton
                type="button"
                size="sm"
                disabled={!selectedEmoji || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    {t('feedback_submitting')}
                  </>
                ) : (
                  t('feedback_submit')
                )}
              </NeoBrutalButton>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
