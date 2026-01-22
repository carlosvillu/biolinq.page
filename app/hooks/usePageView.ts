import { useEffect } from 'react'

export function usePageView(biolinkId: string, isPreview: boolean): void {
  useEffect(() => {
    if (isPreview) {
      return
    }

    const storageKey = `pv_${biolinkId}`

    if (typeof window === 'undefined' || !window.sessionStorage) {
      return
    }

    if (sessionStorage.getItem(storageKey)) {
      return
    }

    sessionStorage.setItem(storageKey, '1')

    fetch('/api/px', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: biolinkId }),
      keepalive: true,
    }).catch(() => {
      // Silently ignore errors
    })
  }, [biolinkId, isPreview])
}
