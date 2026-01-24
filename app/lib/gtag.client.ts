declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetIdOrName: string | Date,
      config?: Record<string, unknown>
    ) => void
    dataLayer: unknown[]
  }
}

export const GA_TRACKING_EVENTS = {
  PAGE_VIEW: 'page_view',
} as const

export function pageview(url: string, measurementId: string): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return
  }
  window.gtag('config', measurementId, { page_path: url })
}

export function setUserProperties(properties: Record<string, string>): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return
  }
  window.gtag('set', 'user_properties', properties)
}

export function initializeGA(measurementId: string, environment: string): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return
  }
  window.gtag('js', new Date())
  window.gtag('config', measurementId, { send_page_view: false })
  setUserProperties({ environment })
}
