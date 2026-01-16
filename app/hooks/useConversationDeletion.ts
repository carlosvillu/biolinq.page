import { useEffect, useRef } from 'react'
import { useFetcher } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export type DeleteConversationActionData =
  | {
      ok: true
    }
  | {
      ok: false
      error?: 'not_found' | 'forbidden'
    }

export function useConversationDeletion(params: { onClose: () => void }) {
  const fetcher = useFetcher<DeleteConversationActionData>()
  const { t } = useTranslation()
  const lastDeletedIdRef = useRef<string | null>(null)

  const { onClose } = params
  const isDeleting = fetcher.state !== 'idle'

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data && lastDeletedIdRef.current !== null) {
      // Reset immediately to prevent re-execution on re-renders
      lastDeletedIdRef.current = null

      if (fetcher.data.ok) {
        toast(t('public_podcast_delete_success_toast'))
        onClose()
        // Server-side redirect handles navigation - no client redirect needed
      } else {
        toast(t('public_podcast_delete_error_toast'))
      }
    }
  }, [fetcher.state, fetcher.data, onClose, t])

  const requestDelete = (conversationId: string) => {
    lastDeletedIdRef.current = conversationId
    fetcher.submit(
      {
        intent: 'delete-conversation',
        conversationId,
      },
      {
        method: 'post',
      }
    )
  }

  return {
    requestDelete,
    isDeleting,
  }
}
