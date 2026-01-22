import { useTranslation } from 'react-i18next'

export function SocialProofSection() {
  const { t } = useTranslation()

  return (
    <section className="py-16 md:py-24 px-4 bg-neo-canvas">
      <div className="max-w-3xl mx-auto text-center">
        <div className="mb-12">
          <span className="text-6xl text-neo-primary font-serif">&ldquo;</span>
          <blockquote className="text-xl md:text-2xl text-neo-dark font-medium italic -mt-8 mb-4">
            {t('social_quote')}
          </blockquote>
          <p className="text-gray-600">{t('social_quote_attribution')}</p>
        </div>

        <div className="inline-block border-3 border-neo-dark bg-white p-6 shadow-neo">
          <p className="text-lg font-bold text-neo-dark mb-2">{t('social_speed_title')}</p>
          <p className="text-5xl md:text-6xl font-bold text-neo-primary mb-2">
            {t('social_speed_score')}
          </p>
          <p className="text-sm text-gray-600 mb-2">{t('social_speed_source')}</p>
          <p className="text-xs text-gray-500 italic">{t('social_speed_note')}</p>
        </div>
      </div>
    </section>
  )
}
