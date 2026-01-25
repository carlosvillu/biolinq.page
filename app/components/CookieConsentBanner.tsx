import { useTranslation } from 'react-i18next'
import { useConsent } from '~/hooks/useConsent'

export function CookieConsentBanner() {
  const { consent, initialized, acceptAll, rejectAll } = useConsent()
  const { t } = useTranslation()

  // Don't render until initialized (prevents SSR mismatch)
  if (!initialized) return null

  // Don't render if user already made a choice
  if (consent !== 'pending') return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="relative mx-auto max-w-4xl">
        {/* Shadow layer */}
        <div className="absolute inset-0 translate-x-1 translate-y-1 rounded bg-neo-dark" />

        {/* Content layer */}
        <div className="relative z-10 rounded border-[3px] border-neo-dark bg-neo-panel p-4 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Text section */}
            <div className="flex-1">
              <p className="mb-1 font-bold text-neo-dark">{t('consent_banner_title')}</p>
              <p className="text-sm text-neo-dark/80">{t('consent_banner_description')}</p>
            </div>

            {/* Buttons section */}
            <div className="flex flex-shrink-0 gap-3">
              {/* Reject button (secondary style) */}
              <button
                type="button"
                onClick={rejectAll}
                className="relative inline-flex items-center justify-center rounded border-[3px] border-neo-dark bg-white px-4 py-2 font-bold text-neo-dark transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 dark:bg-gray-800 dark:text-white"
              >
                {t('consent_reject_all')}
              </button>

              {/* Accept button (primary style) */}
              <button
                type="button"
                onClick={acceptAll}
                className="relative inline-flex items-center justify-center rounded border-[3px] border-neo-dark bg-neo-primary px-4 py-2 font-bold text-neo-dark transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0"
              >
                {t('consent_accept_all')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
