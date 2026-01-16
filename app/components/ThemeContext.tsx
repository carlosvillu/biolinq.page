import { createContext, useContext, useState, useEffect } from 'react'
import type { Theme, ThemePreference } from '~/lib/theme'
import { resolveTheme, setThemeCookie } from '~/lib/theme'

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

export function ThemeProvider({ children, initialPreference }: ThemeProviderProps) {
  const [preference, setPreference] = useState<ThemePreference>(
    initialPreference || 'system',
  )
  const [systemPreference, setSystemPreference] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const theme = resolveTheme(preference, systemPreference)

  // Listen to system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Apply theme class to HTML element
  useEffect(() => {
    const root = document.documentElement

    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  const setTheme = (newPreference: ThemePreference) => {
    setPreference(newPreference)

    // Update cookie
    document.cookie = setThemeCookie(newPreference)
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
