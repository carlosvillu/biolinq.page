import { useEffect, useRef } from 'react'

interface GoogleAnalyticsProps {
  measurementId: string | undefined
  nodeEnv: string
  hashedUserId: string | null
  hasConsent: boolean
  userMeasurementId?: string | undefined
}

export function GoogleAnalytics({
  measurementId,
  nodeEnv,
  hashedUserId,
  hasConsent,
  userMeasurementId,
}: GoogleAnalyticsProps) {
  const initialized = useRef(false)

  useEffect(() => {
    if (!hasConsent || initialized.current) {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    // At least one measurement ID must be present
    if (!measurementId && !userMeasurementId) {
      return
    }

    initialized.current = true

    // Initialize dataLayer and gtag function
    window.dataLayer = window.dataLayer || []
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args)
    }
    window.gtag = gtag

    gtag('js', new Date())

    // Configure site GA4 (always present if available)
    if (measurementId) {
      gtag('config', measurementId, {
        send_page_view: false,
        ...(hashedUserId ? { user_id: hashedUserId } : {}),
      })
    }

    // Configure user's GA4 (only if they're premium and have configured it)
    if (userMeasurementId) {
      gtag('config', userMeasurementId, {
        send_page_view: false,
        ...(hashedUserId ? { user_id: hashedUserId } : {}),
      })
    }

    gtag('set', 'user_properties', { environment: nodeEnv })

    // Load the gtag.js script dynamically (use site ID as primary)
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId || userMeasurementId}`
    document.head.appendChild(script)
  }, [measurementId, nodeEnv, hashedUserId, hasConsent, userMeasurementId])

  return null
}
