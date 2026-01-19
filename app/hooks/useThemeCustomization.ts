import { useState, useMemo } from 'react'
import type { ThemeId } from '~/lib/themes'

interface UseThemeCustomizationProps {
  initialTheme: ThemeId
  initialPrimaryColor: string | null
  initialBgColor: string | null
}

export function useThemeCustomization({
  initialTheme,
  initialPrimaryColor,
  initialBgColor,
}: UseThemeCustomizationProps) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(initialTheme)
  const [primaryColor, setPrimaryColor] = useState<string | null>(initialPrimaryColor)
  const [bgColor, setBgColor] = useState<string | null>(initialBgColor)

  const hasChanges = useMemo(() => {
    return (
      selectedTheme !== initialTheme ||
      primaryColor !== initialPrimaryColor ||
      bgColor !== initialBgColor
    )
  }, [selectedTheme, primaryColor, bgColor, initialTheme, initialPrimaryColor, initialBgColor])

  const setTheme = (theme: ThemeId) => {
    setSelectedTheme(theme)
  }

  const handlePrimaryColorChange = (color: string) => {
    setPrimaryColor(color)
  }

  const handleBgColorChange = (color: string) => {
    setBgColor(color)
  }

  const resetColors = () => {
    setPrimaryColor(null)
    setBgColor(null)
  }

  return {
    selectedTheme,
    primaryColor,
    bgColor,
    hasChanges,
    setTheme,
    setPrimaryColor: handlePrimaryColorChange,
    setBgColor: handleBgColorChange,
    resetColors,
  }
}
