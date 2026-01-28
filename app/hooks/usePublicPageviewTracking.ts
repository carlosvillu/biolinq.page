import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'

import { pageview } from '~/lib/gtag.client'
import { setLanguageProperty } from '~/lib/analytics-events'

export function usePublicPageviewTracking(
  siteMeasurementId: string | undefined,
  userMeasurementId: string | undefined
): void {
  const location = useLocation()
  const { i18n } = useTranslation()

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const path = location.pathname + location.search

    setLanguageProperty(i18n.language)

    // Track to site GA4 (always)
    if (siteMeasurementId) {
      pageview(path, siteMeasurementId)
    }

    // Track to user's GA4 (only if configured)
    if (userMeasurementId) {
      pageview(path, userMeasurementId)
    }
  }, [location.pathname, location.search, siteMeasurementId, userMeasurementId, i18n.language])
}
