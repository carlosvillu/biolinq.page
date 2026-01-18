import { useTranslation } from 'react-i18next'
import { Form, useNavigation } from 'react-router'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { NeoBrutalButton } from '~/components/neo-brutal/NeoBrutalButton'

interface DeleteLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  linkId: string
  linkTitle: string
}

export function DeleteLinkDialog({
  open,
  onOpenChange,
  linkId,
  linkTitle,
}: DeleteLinkDialogProps) {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const isDeleting =
    navigation.state === 'submitting' &&
    navigation.formData?.get('intent') === 'delete'

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 bg-black/50 z-40" />

        <AlertDialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white border-[3px] border-neo-dark rounded-xl p-6 shadow-hard-lg z-50">
          <AlertDialog.Title className="text-xl font-bold mb-2">
            {t('dashboard_delete_link_title')}
          </AlertDialog.Title>

          <AlertDialog.Description className="text-gray-600 mb-6">
            {t('dashboard_delete_link_confirm', { title: linkTitle })}
          </AlertDialog.Description>

          <Form method="post">
            <input type="hidden" name="intent" value="delete" />
            <input type="hidden" name="linkId" value={linkId} />

            <div className="flex gap-3 justify-end">
              <NeoBrutalButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                {t('cancel')}
              </NeoBrutalButton>

              <NeoBrutalButton
                type="submit"
                variant="accent"
                size="sm"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="inline-block animate-spin mr-2">⏳</span>
                ) : null}
                {t('dashboard_delete_link_button')}
              </NeoBrutalButton>
            </div>
          </Form>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
