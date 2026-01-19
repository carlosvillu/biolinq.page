import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

export function PublicNotFound() {
  const { t } = useTranslation()

  return (
    <main className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black mb-4">404</div>

        <h1 className="text-2xl font-bold mb-2">{t('public_not_found_title')}</h1>
        <p className="text-gray-600 mb-8">{t('public_not_found_description')}</p>

        <div className="relative group inline-block">
          <div className="absolute inset-0 bg-dark rounded translate-x-1 translate-y-1" />

          <Link
            to="/"
            className="relative z-10 inline-flex items-center justify-center
              px-6 py-3 bg-primary text-dark font-bold border-[3px] border-dark rounded
              group-hover:-translate-y-px group-hover:-translate-x-px
              transition-transform"
          >
            {t('public_not_found_cta')}
          </Link>
        </div>
      </div>
    </main>
  )
}
