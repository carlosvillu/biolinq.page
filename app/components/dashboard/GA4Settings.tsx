import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetcher } from 'react-router'
import { NeoBrutalCard } from '../neo-brutal/NeoBrutalCard'
import { NeoBrutalButton } from '../neo-brutal/NeoBrutalButton'
import { cn } from '~/lib/utils'

interface GA4SettingsProps {
  biolinkId: string
  ga4MeasurementId: string | null
  isPremium: boolean
}

export function GA4Settings({ biolinkId, ga4MeasurementId, isPremium }: GA4SettingsProps) {
  const { t } = useTranslation()
  const fetcher = useFetcher()
  const [inputValue, setInputValue] = useState(ga4MeasurementId || '')

  const isSubmitting = fetcher.state === 'submitting'
  const hasChanges = inputValue !== (ga4MeasurementId || '')
  const isLocked = !isPremium

  // Validate format: G-XXXXXXXXXX (10 alphanumeric chars after G-)
  const isValidFormat = inputValue === '' || /^G-[A-Z0-9]{10}$/i.test(inputValue)

  return (
    <NeoBrutalCard variant="white">
      <h3 className="text-lg font-bold mb-2">{t('ga4_settings_title')}</h3>
      <p className="text-sm text-gray-600 mb-6">{t('ga4_settings_description')}</p>

      {/* Content with blur for free users */}
      <div className="relative">
        <div className={cn(isLocked && 'opacity-50 blur-[1px] select-none pointer-events-none')}>
          <div className="space-y-4">
            <div>
              <label htmlFor="ga4-measurement-id" className="block text-sm font-bold mb-2">
                {t('ga4_measurement_id_label')}
              </label>
              <input
                id="ga4-measurement-id"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="G-XXXXXXXXXX"
                disabled={isLocked}
                className={cn(
                  'w-full px-4 py-3 bg-white border-2 border-neo-dark rounded-sm',
                  'shadow-[4px_4px_0px_0px_rgba(19,34,63,1)]',
                  'focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(19,34,63,1)] focus:translate-x-[2px] focus:translate-y-[2px]',
                  'transition-all disabled:bg-gray-100 disabled:cursor-not-allowed',
                  !isValidFormat && inputValue && 'border-red-500 focus:border-red-500'
                )}
              />
              {!isValidFormat && inputValue && (
                <p className="mt-2 text-sm text-red-600">{t('ga4_invalid_format')}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">{t('ga4_format_hint')}</p>
            </div>

            {ga4MeasurementId && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-sm">
                <p className="text-sm text-green-800">
                  <span className="font-bold">{t('ga4_current_id')}:</span> {ga4MeasurementId}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Premium overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-neo-accent text-white text-xs font-bold px-2 py-1 border border-neo-dark shadow-sm">
              PREMIUM
            </span>
          </div>
        )}
      </div>

      {/* Save button (outside blur) */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="updateGA4" />
          <input type="hidden" name="biolinkId" value={biolinkId} />
          <input
            type="hidden"
            name="ga4MeasurementId"
            value={inputValue || ''}
          />

          <NeoBrutalButton
            type="submit"
            disabled={!hasChanges || isLocked || isSubmitting || !isValidFormat}
            className="w-full"
          >
            {isSubmitting ? t('saving') : t('ga4_save_button')}
          </NeoBrutalButton>
        </fetcher.Form>
      </div>
    </NeoBrutalCard>
  )
}
