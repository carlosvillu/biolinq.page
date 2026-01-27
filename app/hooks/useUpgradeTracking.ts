import { useSearchParams } from 'react-router'
import { useEffect, useRef } from 'react'
import { trackPurchase } from '~/lib/analytics-events'

export function useUpgradeTracking(): void {
  const [searchParams, setSearchParams] = useSearchParams()
  const hasFired = useRef(false)

  useEffect(() => {
    const upgrade = searchParams.get('upgrade')
    const sessionId = searchParams.get('session_id')

    if (upgrade !== 'success' || !sessionId || hasFired.current) {
      return
    }

    const validSessionId = sessionId
    let retries = 0
    const maxRetries = 10
    const retryDelay = 100

    function tryTrackPurchase() {
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        hasFired.current = true
        trackPurchase(validSessionId)

        const newParams = new URLSearchParams(searchParams)
        newParams.delete('upgrade')
        newParams.delete('session_id')
        setSearchParams(newParams, { replace: true })
        return
      }

      if (retries < maxRetries) {
        retries++
        setTimeout(tryTrackPurchase, retryDelay)
      }
    }

    tryTrackPurchase()
  }, [searchParams, setSearchParams])
}
