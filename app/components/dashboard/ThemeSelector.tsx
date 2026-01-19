import { useTranslation } from 'react-i18next'
import { THEMES, type ThemeId } from '~/lib/themes'
import { ThemePreviewCard } from './ThemePreviewCard'

interface ThemeSelectorProps {
  selectedTheme: ThemeId
  onThemeChange: (theme: ThemeId) => void
  disabled: boolean
}

export function ThemeSelector({ selectedTheme, onThemeChange, disabled }: ThemeSelectorProps) {
  const { t } = useTranslation()

  return (
    <div>
      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
        {t('customization_theme_title')}
      </h4>

      <div
        role="radiogroup"
        aria-label={t('customization_theme_title')}
        className="grid grid-cols-2 gap-3"
      >
        {Object.values(THEMES).map((theme) => (
          <ThemePreviewCard
            key={theme.id}
            theme={theme}
            isSelected={selectedTheme === theme.id}
            disabled={disabled}
            onClick={() => !disabled && onThemeChange(theme.id)}
          />
        ))}
      </div>
    </div>
  )
}
