import { useSearchParams } from 'react-router'
import { useEffect, useRef } from 'react'
import { trackPurchase } from '~/lib/analytics-events'

export function useUpgradeTracking(): void {
  const [searchParams, setSearchParams] = useSearchParams()
  const hasFired = useRef(false)

  useEffect(() => {
    const upgrade = searchParams.get('upgrade')
    const sessionId = searchParams.get('session_id')

    if (upgrade === 'success' && sessionId && !hasFired.current) {
      hasFired.current = true
      trackPurchase(sessionId)

      const newParams = new URLSearchParams(searchParams)
      newParams.delete('upgrade')
      newParams.delete('session_id')
      setSearchParams(newParams, { replace: true })
    }
  }, [searchParams, setSearchParams])
}
