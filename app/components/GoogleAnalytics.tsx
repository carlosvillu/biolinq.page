import { useEffect, useRef } from 'react'

interface GoogleAnalyticsProps {
  measurementId: string | undefined
  nodeEnv: string
  hashedUserId: string | null
  hasConsent: boolean
}

export function GoogleAnalytics({
  measurementId,
  nodeEnv,
  hashedUserId,
  hasConsent,
}: GoogleAnalyticsProps) {
  const initialized = useRef(false)

  useEffect(() => {
    if (!measurementId || !hasConsent || initialized.current) {
      return
    }

    if (typeof window === 'undefined') {
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
    gtag('config', measurementId, {
      send_page_view: false,
      ...(hashedUserId ? { user_id: hashedUserId } : {}),
    })
    gtag('set', 'user_properties', { environment: nodeEnv })

    // Load the gtag.js script dynamically
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    document.head.appendChild(script)
  }, [measurementId, nodeEnv, hashedUserId, hasConsent])

  return null
}
