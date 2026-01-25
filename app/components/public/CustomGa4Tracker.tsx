import { useEffect, useRef } from 'react'

interface CustomGa4TrackerProps {
  customGa4TrackingId: string | null
}

/**
 * Initializes a secondary GA4 tracking configuration for the biolink owner.
 * This allows biolink owners to track visitors on their public profile page
 * using their own GA4 property, in addition to BioLinq's main analytics.
 */
export function CustomGa4Tracker({ customGa4TrackingId }: CustomGa4TrackerProps) {
  const initialized = useRef(false)

  useEffect(() => {
    if (!customGa4TrackingId || initialized.current) {
      return
    }

    if (typeof window === 'undefined' || !window.gtag) {
      return
    }

    initialized.current = true

    // Add a secondary config for the biolink owner's GA4 property
    // This will send all subsequent gtag events to both properties
    window.gtag('config', customGa4TrackingId, {
      send_page_view: true,
    })
  }, [customGa4TrackingId])

  return null
}
