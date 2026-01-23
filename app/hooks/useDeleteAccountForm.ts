import { useState, useMemo } from 'react'

export function useDeleteAccountForm(expectedUsername: string) {
  const [inputValue, setInputValue] = useState('')

  const isValid = useMemo(() => {
    return inputValue.trim() === expectedUsername.trim()
  }, [inputValue, expectedUsername])

  const reset = () => {
    setInputValue('')
  }

  return {
    inputValue,
    setInputValue,
    isValid,
    reset,
  }
}
