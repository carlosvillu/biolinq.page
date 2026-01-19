import type { BiolinkTheme } from '~/db/schema/biolinks'

export type ThemeId = BiolinkTheme

export type ThemeColors = {
  background: string
  text: string
  textMuted: string
  primary: string
  primaryText: string
  border: string
  cardBg: string
  shadow: string
}

export type ThemeStyle = {
  fontFamily: 'sans' | 'mono' | 'display'
  fontWeight: 'normal' | 'medium' | 'bold'
  borderWidth: '0' | '1px' | '2px' | '3px'
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full'
  shadowType: 'none' | 'soft' | 'hard' | 'glow'
  shadowOffset: string
  hoverEffect: 'none' | 'lift' | 'scale' | 'glow'
  avatarStyle: 'circle' | 'rounded' | 'square'
}

export type Theme = {
  id: ThemeId
  name: string
  colors: ThemeColors
  style: ThemeStyle
}

export const THEMES: Record<ThemeId, Theme> = {
  brutalist: {
    id: 'brutalist',
    name: 'Brutalist',
    colors: {
      background: '#FFFDF8',
      text: '#111827',
      textMuted: '#6B7280',
      primary: '#ffc480',
      primaryText: '#111827',
      border: '#111827',
      cardBg: '#FFFFFF',
      shadow: '#111827',
    },
    style: {
      fontFamily: 'sans',
      fontWeight: 'bold',
      borderWidth: '3px',
      borderRadius: 'sm',
      shadowType: 'hard',
      shadowOffset: '4px 4px',
      hoverEffect: 'lift',
      avatarStyle: 'circle',
    },
  },

  light_minimal: {
    id: 'light_minimal',
    name: 'Light Minimal',
    colors: {
      background: '#FAFAFA',
      text: '#1F2937',
      textMuted: '#9CA3AF',
      primary: '#111827',
      primaryText: '#FFFFFF',
      border: '#E5E7EB',
      cardBg: '#FFFFFF',
      shadow: 'rgba(0,0,0,0.05)',
    },
    style: {
      fontFamily: 'sans',
      fontWeight: 'medium',
      borderWidth: '1px',
      borderRadius: 'lg',
      shadowType: 'soft',
      shadowOffset: '0 4px 12px',
      hoverEffect: 'scale',
      avatarStyle: 'circle',
    },
  },

  dark_mode: {
    id: 'dark_mode',
    name: 'Dark Mode',
    colors: {
      background: '#0F0F0F',
      text: '#F9FAFB',
      textMuted: '#9CA3AF',
      primary: '#22D3EE',
      primaryText: '#0F0F0F',
      border: '#374151',
      cardBg: '#1F1F1F',
      shadow: 'rgba(34,211,238,0.2)',
    },
    style: {
      fontFamily: 'mono',
      fontWeight: 'medium',
      borderWidth: '1px',
      borderRadius: 'md',
      shadowType: 'glow',
      shadowOffset: '0 0 20px',
      hoverEffect: 'glow',
      avatarStyle: 'rounded',
    },
  },

  colorful: {
    id: 'colorful',
    name: 'Colorful',
    colors: {
      background: '#FDF4FF',
      text: '#581C87',
      textMuted: '#A855F7',
      primary: '#E879F9',
      primaryText: '#FFFFFF',
      border: '#F0ABFC',
      cardBg: '#FFFFFF',
      shadow: 'rgba(232,121,249,0.3)',
    },
    style: {
      fontFamily: 'sans',
      fontWeight: 'bold',
      borderWidth: '2px',
      borderRadius: 'full',
      shadowType: 'soft',
      shadowOffset: '0 8px 24px',
      hoverEffect: 'scale',
      avatarStyle: 'circle',
    },
  },
}

export function getThemeById(id: ThemeId | null | undefined): Theme {
  if (!id || !(id in THEMES)) {
    return THEMES['brutalist']
  }
  return THEMES[id]
}

export function resolveThemeColors(
  theme: Theme,
  customPrimaryColor?: string | null,
  customBgColor?: string | null
): ThemeColors {
  return {
    ...theme.colors,
    primary: customPrimaryColor ?? theme.colors.primary,
    background: customBgColor ?? theme.colors.background,
  }
}
