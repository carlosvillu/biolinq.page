import { useCallback, useEffect, useRef, useState } from 'react'

export function useCopyToClipboard(params?: { copiedResetMs?: number }) {
  const copiedResetMs = params?.copiedResetMs ?? 1500

  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const copy = useCallback(
    async (text: string) => {
      const value = String(text ?? '')
      if (!value) return

      setCopied(true)
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => {
        setCopied(false)
      }, copiedResetMs)

      let didCopy = false

      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value)
          didCopy = true
        }
      } catch {
        didCopy = false
      }

      if (!didCopy) {
        try {
          const textarea = document.createElement('textarea')
          textarea.value = value
          textarea.setAttribute('readonly', '')
          textarea.style.position = 'absolute'
          textarea.style.left = '-9999px'
          document.body.appendChild(textarea)
          textarea.select()
          didCopy = document.execCommand('copy')
          document.body.removeChild(textarea)
        } catch {
          didCopy = false
        }
      }
    },
    [copiedResetMs]
  )

  return { copied, copy }
}
