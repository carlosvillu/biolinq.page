import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

export function useCheckoutProcessingToast(input: {
  checkoutParam: string | null
  podcastId: string | null
  podcastStatus: string | null
  onTerminalState: () => void
  t: (key: string) => string
}) {
  const { checkoutParam, podcastId, podcastStatus, onTerminalState, t } = input
  const startedRef = useRef(false)

  const processingToastId = 'checkout-processing'
  const successToastId = 'checkout-success'
  const timeoutToastId = 'checkout-timeout'

  useEffect(() => {
    if (checkoutParam !== 'processing') return
    if (!podcastId) {
      onTerminalState()
      return
    }

    const resolvedPodcastId = podcastId

    if (podcastStatus === 'active') {
      toast.dismiss(processingToastId)
      toast(t('checkout_success_toast'), { id: successToastId })
      onTerminalState()
      return
    }

    if (startedRef.current) return
    startedRef.current = true

    toast(t('checkout_processing_toast'), { id: processingToastId })

    let cancelled = false
    const maxAttempts = 10
    const delayMs = 750

    async function poll() {
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        if (cancelled) return

        try {
          const res = await fetch(
            `/api/stripe/checkout/podcaster/status?podcastId=${encodeURIComponent(resolvedPodcastId)}`,
            { headers: { 'Cache-Control': 'no-store' } }
          )

          if (res.ok) {
            const data: { podcastStatus?: string } = await res.json()
            if (data.podcastStatus === 'active') {
              toast.dismiss(processingToastId)
              toast(t('checkout_success_toast'), { id: successToastId })
              onTerminalState()
              return
            }
          }
        } catch {
          // ignore
        }

        await new Promise((r) => setTimeout(r, delayMs))
      }

      toast.dismiss(processingToastId)
      toast(t('checkout_processing_timeout_toast'), { id: timeoutToastId })
      onTerminalState()
    }

    void poll()

    return () => {
      cancelled = true
    }
  }, [checkoutParam, onTerminalState, podcastId, podcastStatus, t])
}
