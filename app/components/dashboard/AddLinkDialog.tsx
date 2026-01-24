import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Form, useNavigation } from 'react-router'
import { Dialog } from '@base-ui/react/dialog'
import { NeoBrutalButton } from '~/components/neo-brutal/NeoBrutalButton'
import { NeoBrutalInput } from '~/components/neo-brutal/NeoBrutalInput'
import { useAnalytics } from '~/hooks/useAnalytics'

interface AddLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  biolinkId: string
}

export function AddLinkDialog({ open, onOpenChange, biolinkId }: AddLinkDialogProps) {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const { trackLinkAdded } = useAnalytics()
  const isSubmitting =
    navigation.state === 'submitting' && navigation.formData?.get('intent') === 'create'

  const wasSubmittingRef = useRef(false)

  // Track when submission was in progress
  useEffect(() => {
    if (isSubmitting) {
      wasSubmittingRef.current = true
    }
  }, [isSubmitting])

  // Close dialog when submission completes
  useEffect(() => {
    if (wasSubmittingRef.current && navigation.state === 'idle') {
      wasSubmittingRef.current = false
      trackLinkAdded()
      onOpenChange(false)
    }
  }, [navigation.state, onOpenChange, trackLinkAdded])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/50 z-40" />

        <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white border-[3px] border-neo-dark rounded-xl p-6 shadow-hard-lg z-50">
          <Dialog.Title className="text-xl font-bold mb-4">
            {t('dashboard_add_link_title')}
          </Dialog.Title>

          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="create" />
            <input type="hidden" name="biolinkId" value={biolinkId} />

            {/* Emoji field */}
            <div>
              <label htmlFor="emoji" className="block font-medium mb-1">
                {t('dashboard_link_emoji_label')}
              </label>
              <input
                type="text"
                id="emoji"
                name="emoji"
                placeholder="🔗"
                maxLength={2}
                className="w-16 text-center text-2xl p-2 bg-neo-input border-[3px] border-neo-dark rounded focus:outline-none focus:ring-2 focus:ring-neo-primary"
              />
              <p className="text-xs text-gray-500 mt-1">{t('dashboard_emoji_hint')}</p>
            </div>

            {/* Title field */}
            <div>
              <label htmlFor="title" className="block font-medium mb-1">
                {t('dashboard_link_title_label')} *
              </label>
              <NeoBrutalInput
                id="title"
                name="title"
                required
                maxLength={50}
                placeholder={t('dashboard_link_title_placeholder')}
              />
            </div>

            {/* URL field */}
            <div>
              <label htmlFor="url" className="block font-medium mb-1">
                {t('dashboard_link_url_label')} *
              </label>
              <NeoBrutalInput
                id="url"
                name="url"
                type="url"
                required
                placeholder="https://example.com"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4">
              <NeoBrutalButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                {t('cancel')}
              </NeoBrutalButton>

              <NeoBrutalButton type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? <span className="inline-block animate-spin mr-2">⏳</span> : null}
                {t('dashboard_save_link')}
              </NeoBrutalButton>
            </div>
          </Form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
