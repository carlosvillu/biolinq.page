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
    const userType = data.isPremium ? 'premium' : 'free'
    setUserTypeProperty(userType)

    setHasBiolinkProperty(data.hasBiolink)

    if (data.linkCount !== null) {
      setLinkCountProperty(data.linkCount)
    }
  }, [data.isPremium, data.hasBiolink, data.linkCount])
}
