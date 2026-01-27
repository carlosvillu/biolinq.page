import { useEffect } from 'react'
import {
  setUserTypeProperty,
  setHasBiolinkProperty,
  setLinkCountProperty,
} from '~/lib/analytics-events'

interface UserPropertiesData {
  isPremium: boolean
  hasBiolink: boolean
  linkCount: number | null
}

export function useUserPropertiesTracking(data: UserPropertiesData): void {
  useEffect(() => {
    let retries = 0
    const maxRetries = 10
    const retryDelay = 100

    function trySetProperties() {
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        const userType = data.isPremium ? 'premium' : 'free'
        setUserTypeProperty(userType)
        setHasBiolinkProperty(data.hasBiolink)
        if (data.linkCount !== null) {
          setLinkCountProperty(data.linkCount)
        }
        return
      }

      if (retries < maxRetries) {
        retries++
        setTimeout(trySetProperties, retryDelay)
      }
    }

    trySetProperties()
  }, [data.isPremium, data.hasBiolink, data.linkCount])
}
