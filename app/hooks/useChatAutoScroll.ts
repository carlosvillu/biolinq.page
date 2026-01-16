import { useCallback, useEffect, useRef, useState } from 'react'

export function useChatAutoScroll(params: {
  depsKey: unknown
  bottomThresholdPx?: number
  behavior?: ScrollBehavior
}) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null)

  const [isAtBottom, setIsAtBottom] = useState(true)

  const setScrollContainerEl = useCallback((node: HTMLDivElement | null) => {
    scrollContainerRef.current = node
  }, [])

  const setBottomSentinelEl = useCallback((node: HTMLDivElement | null) => {
    bottomSentinelRef.current = node
  }, [])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const bottomThresholdPx = params.bottomThresholdPx ?? 80

    const onScroll = () => {
      const distanceToBottom = el.scrollHeight - (el.scrollTop + el.clientHeight)
      setIsAtBottom(distanceToBottom <= bottomThresholdPx)
    }

    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
    }
  }, [params.bottomThresholdPx])

  useEffect(() => {
    if (!isAtBottom) return

    const sentinel = bottomSentinelRef.current
    if (!sentinel) return

    const behavior = params.behavior ?? 'auto'
    sentinel.scrollIntoView({ behavior, block: 'end' })
  }, [isAtBottom, params.behavior, params.depsKey])

  return {
    scrollContainerElRef: scrollContainerRef,
    bottomSentinelElRef: bottomSentinelRef,
    scrollContainerRef: setScrollContainerEl,
    bottomSentinelRef: setBottomSentinelEl,
    isAtBottom,
  }
}
