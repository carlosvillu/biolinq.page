import type { CSSProperties } from 'react'
import type { ThemeColors, ThemeStyle } from './themes'

export type ThemeCSSVariables = Record<string, string>

export function getThemeCSSVariables(colors: ThemeColors): ThemeCSSVariables {
  return {
    '--theme-bg': colors.background,
    '--theme-text': colors.text,
    '--theme-text-muted': colors.textMuted,
    '--theme-primary': colors.primary,
    '--theme-primary-text': colors.primaryText,
    '--theme-border': colors.border,
    '--theme-card-bg': colors.cardBg,
    '--theme-shadow': colors.shadow,
  }
}

export type ThemeClasses = {
  container: string
  avatar: string
  card: string
  cardHover: string
  text: string
  textMuted: string
}

export function getThemeClasses(style: ThemeStyle): ThemeClasses {
  const fontClass =
    style.fontFamily === 'sans'
      ? 'font-sans'
      : style.fontFamily === 'mono'
        ? 'font-mono'
        : 'font-sans'

  const weightClass =
    style.fontWeight === 'normal'
      ? 'font-normal'
      : style.fontWeight === 'medium'
        ? 'font-medium'
        : 'font-bold'

  const radiusClass =
    style.borderRadius === 'none'
      ? 'rounded-none'
      : style.borderRadius === 'sm'
        ? 'rounded'
        : style.borderRadius === 'md'
          ? 'rounded-lg'
          : style.borderRadius === 'lg'
            ? 'rounded-xl'
            : 'rounded-full'

  const avatarRadius =
    style.avatarStyle === 'circle'
      ? 'rounded-full'
      : style.avatarStyle === 'rounded'
        ? 'rounded-xl'
        : 'rounded-lg'

  const hoverClass =
    style.hoverEffect === 'none'
      ? ''
      : style.hoverEffect === 'lift'
        ? 'group-hover:-translate-y-1 group-hover:-translate-x-1'
        : style.hoverEffect === 'scale'
          ? 'group-hover:scale-[1.02]'
          : 'group-hover:shadow-[0_0_30px_var(--theme-shadow)]'

  return {
    container: fontClass,
    avatar: avatarRadius,
    card: `${radiusClass} ${weightClass}`,
    cardHover: hoverClass,
    text: weightClass,
    textMuted: 'font-normal',
  }
}

export function getThemeShadowStyle(style: ThemeStyle): CSSProperties {
  if (style.shadowType === 'none') {
    return {}
  }

  if (style.shadowType === 'hard') {
    return {
      boxShadow: `${style.shadowOffset} 0 0 var(--theme-shadow)`,
    }
  }

  return {
    boxShadow: `${style.shadowOffset} var(--theme-shadow)`,
  }
}

export function getThemeBorderStyle(style: ThemeStyle): string {
  if (style.borderWidth === '0') {
    return 'border-0'
  }
  return `border-[${style.borderWidth}]`
}
