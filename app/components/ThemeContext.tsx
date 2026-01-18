import { createContext, useContext, useEffect } from 'react'
import type { Theme, ThemePreference } from '~/lib/theme'

type ThemeContextValue = {
  theme: Theme
  preference: ThemePreference
  setTheme: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

type ThemeProviderProps = {
  children: React.ReactNode
  initialPreference?: ThemePreference | null
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Always use light theme
  const theme: Theme = 'light'
  const preference: ThemePreference = 'light'

  // Ensure dark class is removed
  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])

  const setTheme = () => {
    // No-op: theme is always light
  }

  return (
    <ThemeContext.Provider value={{ theme, preference, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
