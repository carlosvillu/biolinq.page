import { useState, useMemo } from 'react'

export function useDeleteAccountForm(expectedUsername: string) {
  const [inputValue, setInputValue] = useState('')

  const isValid = useMemo(() => {
    return (
      inputValue.trim().toLowerCase() === expectedUsername.trim().toLowerCase()
    )
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
