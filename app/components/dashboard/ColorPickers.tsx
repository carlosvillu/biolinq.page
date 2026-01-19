import { useTranslation } from 'react-i18next'
import { cn } from '~/lib/utils'

interface ColorPickersProps {
  primaryColor: string | null
  bgColor: string | null
  onPrimaryChange: (color: string) => void
  onBgChange: (color: string) => void
  onReset: () => void
  disabled: boolean
  defaultPrimaryColor: string
  defaultBgColor: string
}

export function ColorPickers({
  primaryColor,
  bgColor,
  onPrimaryChange,
  onBgChange,
  onReset,
  disabled,
  defaultPrimaryColor,
  defaultBgColor,
}: ColorPickersProps) {
  const { t } = useTranslation()

  const hasCustomColors = primaryColor !== null || bgColor !== null

  return (
    <div>
      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
        {t('customization_colors_title')}
      </h4>

      <div className="flex gap-6">
        {/* Primary Color */}
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="primaryColor" className="text-sm font-medium text-gray-700">
            {t('customization_primary_color')}
          </label>
          <input
            type="color"
            id="primaryColor"
            value={primaryColor ?? defaultPrimaryColor}
            onChange={(e) => onPrimaryChange(e.target.value)}
            disabled={disabled}
            className={cn(
              'w-12 h-12 border-[3px] border-neo-dark rounded cursor-pointer shadow-hard',
              disabled && 'cursor-not-allowed opacity-60'
            )}
          />
        </div>

        {/* Background Color */}
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="bgColor" className="text-sm font-medium text-gray-700">
            {t('customization_bg_color')}
          </label>
          <input
            type="color"
            id="bgColor"
            value={bgColor ?? defaultBgColor}
            onChange={(e) => onBgChange(e.target.value)}
            disabled={disabled}
            className={cn(
              'w-12 h-12 border-[3px] border-neo-dark rounded cursor-pointer shadow-hard',
              disabled && 'cursor-not-allowed opacity-60'
            )}
          />
        </div>
      </div>

      {/* Reset Button */}
      {hasCustomColors && !disabled && (
        <button
          type="button"
          onClick={onReset}
          className="mt-4 text-sm text-gray-600 hover:text-neo-dark underline underline-offset-2 transition-colors"
        >
          {t('customization_reset_colors')}
        </button>
      )}
    </div>
  )
}
