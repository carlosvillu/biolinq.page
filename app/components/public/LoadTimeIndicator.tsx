import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export function LoadTimeIndicator() {
  const { t } = useTranslation()
  const [loadTime, setLoadTime] = useState<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.performance || !performance.timing) {
      return
    }

    const calculateLoadTime = () => {
      const timing = performance.timing
      const time = timing.loadEventEnd - timing.navigationStart
      if (time > 0) {
        setLoadTime(time)
      }
    }

    if (document.readyState === 'complete') {
      calculateLoadTime()
    } else {
      window.addEventListener('load', calculateLoadTime)
      return () => window.removeEventListener('load', calculateLoadTime)
    }
  }, [])

  if (loadTime === null) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10">
      <span className="font-mono text-xs opacity-60" style={{ color: 'var(--theme-text-muted)' }}>
        {t('public_load_time', { time: loadTime })}
      </span>
    </div>
  )
}
