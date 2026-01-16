import { useEffect, useState, useRef } from 'react'

export function useScrollDirection(scrollContainerRef: React.RefObject<HTMLElement | null>) {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          const currentScrollY = container.scrollTop

          if (currentScrollY <= 10) {
            setIsHeaderVisible(true)
            lastScrollY.current = currentScrollY
            ticking.current = false
            return
          }

          const scrollDelta = currentScrollY - lastScrollY.current

          if (scrollDelta < -5) {
            setIsHeaderVisible(true)
          } else if (scrollDelta > 5 && currentScrollY > 20) {
            setIsHeaderVisible(false)
          }

          lastScrollY.current = currentScrollY
          ticking.current = false
        })
        ticking.current = true
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [scrollContainerRef])

  return { isHeaderVisible }
}
