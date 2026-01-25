import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetcher } from 'react-router'
import { NeoBrutalCard } from '../neo-brutal/NeoBrutalCard'
import { NeoBrutalButton } from '../neo-brutal/NeoBrutalButton'
import { cn } from '~/lib/utils'

interface Ga4TrackingSectionProps {
  biolinkId: string
  customGa4TrackingId: string | null
  isPremium: boolean
}

const GA4_ID_PATTERN = /^G-[A-Z0-9]{10}$/

export function Ga4TrackingSection({
  biolinkId,
  customGa4TrackingId,
  isPremium,
}: Ga4TrackingSectionProps) {
  const { t } = useTranslation()
  const fetcher = useFetcher()
  const [trackingIdInput, setTrackingIdInput] = useState(customGa4TrackingId ?? '')

  const isLocked = !isPremium
  const isSubmitting = fetcher.state !== 'idle'

  const fetcherData = fetcher.data as
    | {
        error?: string
        success?: boolean
      }
    | undefined

  const isValidFormat = trackingIdInput === '' || GA4_ID_PATTERN.test(trackingIdInput)
  const hasChanges = trackingIdInput !== (customGa4TrackingId ?? '')

  return (
    <NeoBrutalCard variant="white">
      <h3 className="text-lg font-bold mb-2">{t('ga4_tracking_title')}</h3>
      <p className="text-sm text-gray-600 mb-6">{t('ga4_tracking_description')}</p>

      <div className="relative">
        <div className={cn(isLocked && 'opacity-50 blur-[1px] select-none pointer-events-none')}>
          <fetcher.Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="updateGa4TrackingId" />
            <input type="hidden" name="biolinkId" value={biolinkId} />

            <div>
              <label htmlFor="ga4TrackingId" className="block text-sm font-medium mb-1">
                {t('ga4_tracking_label')}
              </label>
              <input
                id="ga4TrackingId"
                name="ga4TrackingId"
                type="text"
                placeholder="G-XXXXXXXXXX"
                value={trackingIdInput}
                onChange={(e) => setTrackingIdInput(e.target.value.toUpperCase())}
                className={cn(
                  'w-full px-3 py-2 border-2 border-neo-dark bg-white font-mono text-sm',
                  !isValidFormat && trackingIdInput !== '' && 'border-red-500'
                )}
              />
              <p className="text-xs text-gray-500 mt-1">{t('ga4_tracking_hint')}</p>
            </div>

            {!isValidFormat && trackingIdInput !== '' && (
              <p className="text-sm text-red-600">{t('ga4_tracking_error_invalid_format')}</p>
            )}

            {fetcherData?.error && (
              <p className="text-sm text-red-600">{t(`ga4_tracking_error_${fetcherData.error}`)}</p>
            )}

            {fetcherData?.success && (
              <p className="text-sm text-green-600">{t('ga4_tracking_saved')}</p>
            )}

            {customGa4TrackingId && (
              <div className="bg-green-50 border border-green-200 p-3">
                <p className="text-sm text-green-800">
                  <span className="font-medium">{t('ga4_tracking_active')}: </span>
                  <code className="font-mono">{customGa4TrackingId}</code>
                </p>
              </div>
            )}

            <NeoBrutalButton
              type="submit"
              disabled={!isValidFormat || isSubmitting || !hasChanges}
              className="w-full"
            >
              {isSubmitting ? t('saving') : t('ga4_tracking_save')}
            </NeoBrutalButton>

            {customGa4TrackingId && (
              <button
                type="button"
                onClick={() => {
                  setTrackingIdInput('')
                  const formData = new FormData()
                  formData.set('intent', 'updateGa4TrackingId')
                  formData.set('biolinkId', biolinkId)
                  formData.set('ga4TrackingId', '')
                  fetcher.submit(formData, { method: 'post' })
                }}
                disabled={isSubmitting}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                {t('ga4_tracking_remove')}
              </button>
            )}
          </fetcher.Form>
        </div>

        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-neo-accent text-white text-xs font-bold px-2 py-1 border border-neo-dark shadow-sm">
              PREMIUM
            </span>
          </div>
        )}
      </div>
    </NeoBrutalCard>
  )
}
