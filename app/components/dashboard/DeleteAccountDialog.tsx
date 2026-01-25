import { useState } from 'react'
import { Form } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Dialog } from '@base-ui/react/dialog'
import { NeoBrutalButton } from '../neo-brutal/NeoBrutalButton'
import { useDeleteAccountForm } from '~/hooks/useDeleteAccountForm'
import { useAnalytics } from '~/hooks/useAnalytics'

interface DeleteAccountDialogProps {
  username: string
}

export function DeleteAccountDialog({ username }: DeleteAccountDialogProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const { inputValue, setInputValue, isValid, reset } = useDeleteAccountForm(username)
  const { trackDeleteAccountStarted, trackAccountDeleted } = useAnalytics()

  const handleOpenChange = (open: boolean) => {
    if (open) {
      trackDeleteAccountStarted()
    }
    setIsOpen(open)
    if (!open) {
      // Reset form when dialog closes
      reset()
    }
  }

  const handleSubmit = () => {
    if (isValid) {
      trackAccountDeleted()
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Trigger>
        <NeoBrutalButton variant="accent" size="md">
          {t('account_delete_button')}
        </NeoBrutalButton>
      </Dialog.Trigger>

      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Backdrop className="fixed inset-0 min-h-dvh bg-black/50 transition-all duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 z-50" />

        {/* Popup */}
        <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 z-50 transition-all duration-200 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0">
          {/* Neo-Brutal Card Wrapper */}
          <div className="relative">
            {/* Shadow Layer */}
            <div className="absolute inset-0 bg-neo-dark rounded-xl translate-x-2 translate-y-2" />

            {/* Card Content */}
            <div className="relative z-10 bg-white border-[3px] border-neo-dark rounded-xl p-6 md:p-8">
              {/* Title */}
              <Dialog.Title className="text-2xl font-bold text-neo-dark mb-3">
                {t('delete_account_title')}
              </Dialog.Title>

              {/* Description */}
              <Dialog.Description className="text-base text-gray-700 mb-6">
                {t('delete_account_description')}
              </Dialog.Description>

              {/* Form */}
              <Form method="post" onSubmit={handleSubmit} className="space-y-6">
                <input type="hidden" name="intent" value="deleteAccount" />

                {/* Confirmation Input */}
                <div>
                  <label
                    htmlFor="username-confirm"
                    className="block text-sm font-bold text-gray-700 mb-2"
                    dangerouslySetInnerHTML={{
                      __html: t('delete_account_confirmation_label', {
                        username,
                      }),
                    }}
                  />
                  <div className="relative">
                    <div className="absolute inset-0 bg-neo-dark rounded translate-x-1 translate-y-1" />
                    <input
                      id="username-confirm"
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={t('delete_account_placeholder')}
                      className="relative z-10 w-full px-4 py-3 bg-neo-input border-[3px] border-neo-dark rounded text-neo-dark font-medium focus:outline-none placeholder-gray-500"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                  <Dialog.Close>
                    <NeoBrutalButton variant="secondary" size="md" type="button">
                      {t('cancel')}
                    </NeoBrutalButton>
                  </Dialog.Close>

                  <NeoBrutalButton variant="accent" size="md" type="submit" disabled={!isValid}>
                    {t('delete_account_confirm_button')}
                  </NeoBrutalButton>
                </div>
              </Form>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
