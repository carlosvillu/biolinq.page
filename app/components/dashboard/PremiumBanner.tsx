import { useTranslation } from 'react-i18next'
import { NeoBrutalButton } from '../neo-brutal/NeoBrutalButton'

export function PremiumBanner() {
  const { t } = useTranslation()

  return (
    <div className="sticky top-16 z-30 w-full bg-neo-accent border-b-[3px] border-neo-dark">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-white">
          <span className="text-xl">✨</span>
          <p className="font-bold text-sm sm:text-base">{t('premium_banner_message')}</p>
        </div>

        <form method="POST" action="/api/stripe/checkout">
          <NeoBrutalButton type="submit" variant="primary" size="sm" className="whitespace-nowrap">
            {t('premium_banner_cta')}
          </NeoBrutalButton>
        </form>
      </div>
    </div>
  )
}
