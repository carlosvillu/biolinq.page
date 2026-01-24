import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'

import { pageview } from '~/lib/gtag.client'
import { setLanguageProperty } from '~/lib/analytics-events'

export function usePageviewTracking(measurementId: string | undefined): void {
  const location = useLocation()
  const { i18n } = useTranslation()

  useEffect(() => {
    if (!measurementId) {
      return
    }
    if (typeof window === 'undefined') {
      return
    }
    setLanguageProperty(i18n.language)
    pageview(location.pathname + location.search, measurementId)
  }, [location.pathname, location.search, measurementId, i18n.language])
}
