import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'biolinq_analytics_consent'
const CONSENT_CHANGE_EVENT = 'biolinq_consent_change'

export type ConsentState = 'pending' | 'accepted' | 'rejected'

interface UseConsentReturn {
  consent: ConsentState
  initialized: boolean
  acceptAll: () => void
  rejectAll: () => void
}

function getStoredConsent(): ConsentState {
  if (typeof window === 'undefined') return 'pending'
  const storedValue = localStorage.getItem(STORAGE_KEY)
  if (storedValue === 'accepted') return 'accepted'
  if (storedValue === 'rejected') return 'rejected'
  return 'pending'
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback)
  window.addEventListener(CONSENT_CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(CONSENT_CHANGE_EVENT, callback)
  }
}

function getServerConsentSnapshot(): ConsentState {
  return 'pending'
}

function getServerInitializedSnapshot(): boolean {
  return false
}

export function useConsent(): UseConsentReturn {
  const consent = useSyncExternalStore(subscribe, getStoredConsent, getServerConsentSnapshot)

  // Use useSyncExternalStore for initialized to prevent hydration mismatch
  // Server always returns false, client reads actual state after hydration
  const initialized = useSyncExternalStore(
    subscribe,
    () => true,
    getServerInitializedSnapshot
  )

  const acceptAll = useCallback(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, 'accepted')
    window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT))
  }, [])

  const rejectAll = useCallback(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, 'rejected')
    window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT))
  }, [])

  return { consent, initialized, acceptAll, rejectAll }
}
