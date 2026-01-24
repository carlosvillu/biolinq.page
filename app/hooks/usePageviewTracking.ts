import { useEffect } from 'react'
import { useLocation } from 'react-router'

import { pageview } from '~/lib/gtag.client'

export function usePageviewTracking(measurementId: string | undefined): void {
  const location = useLocation()

  useEffect(() => {
    if (!measurementId) {
      return
    }
    if (typeof window === 'undefined') {
      return
    }
    pageview(location.pathname + location.search, measurementId)
  }, [location.pathname, location.search, measurementId])
}
