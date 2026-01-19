import { useTranslation } from 'react-i18next'
import type { Theme } from '~/lib/themes'
import { cn } from '~/lib/utils'

interface ThemePreviewCardProps {
  theme: Theme
  isSelected: boolean
  disabled: boolean
  onClick: () => void
}

export function ThemePreviewCard({ theme, isSelected, disabled, onClick }: ThemePreviewCardProps) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative w-full p-3 rounded transition-all duration-200',
        'border-[3px] focus:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary',
        isSelected
          ? 'border-neo-primary shadow-hard'
          : 'border-neo-dark/30 hover:border-neo-dark/60',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      )}
      style={{ backgroundColor: theme.colors.background }}
    >
      {/* Mini Preview Content */}
      <div className="flex flex-col items-center gap-2">
        {/* Mini Avatar */}
        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.colors.primary }} />

        {/* Mini Link Cards */}
        <div className="w-full space-y-1.5">
          <div
            className="h-4 rounded-sm"
            style={{
              backgroundColor: theme.colors.cardBg,
              border: `1px solid ${theme.colors.border}`,
            }}
          />
          <div
            className="h-4 rounded-sm"
            style={{
              backgroundColor: theme.colors.cardBg,
              border: `1px solid ${theme.colors.border}`,
            }}
          />
        </div>
      </div>

      {/* Theme Name */}
      <p
        className="mt-2 text-xs font-bold text-center truncate"
        style={{ color: theme.colors.text }}
      >
        {t(`theme_${theme.id}`)}
      </p>

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-neo-primary border-2 border-neo-dark rounded-full flex items-center justify-center">
          <svg
            className="w-2.5 h-2.5 text-neo-dark"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  )
}
