import { useTranslation } from 'react-i18next'
import { PricingCard, type PricingFeature } from './PricingCard'
import { useAnalytics } from '~/hooks/useAnalytics'

export function PricingSection() {
  const { t } = useTranslation()
  const { trackPremiumCTAClicked } = useAnalytics()

  const freeFeatures: PricingFeature[] = [
    { text: t('pricing_feature_links'), included: true },
    { text: t('pricing_feature_themes'), included: true },
    { text: t('pricing_feature_total_views'), included: true },
    { text: t('pricing_feature_clicks_per_link'), included: false },
    { text: t('pricing_feature_history'), included: false },
    { text: t('pricing_feature_custom_colors'), included: false },
    { text: t('pricing_feature_no_watermark'), included: false },
  ]

  const premiumFeatures: PricingFeature[] = [
    { text: t('pricing_feature_links'), included: true },
    { text: t('pricing_feature_themes_custom'), included: true },
    { text: t('pricing_feature_total_views'), included: true },
    { text: t('pricing_feature_clicks_per_link'), included: true },
    { text: t('pricing_feature_history'), included: true },
    { text: t('pricing_feature_custom_colors'), included: true },
    { text: t('pricing_feature_no_watermark'), included: true },
  ]

  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Section Title */}
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-4 text-neo-dark">
          {t('pricing_title')}
        </h2>
        <p className="text-gray-700 text-center mb-12 max-w-xl mx-auto">{t('pricing_subtitle')}</p>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-start">
          <PricingCard
            name={t('pricing_free_name')}
            price={t('pricing_free_price')}
            priceNote={t('pricing_free_note')}
            features={freeFeatures}
          />
          <PricingCard
            name={t('pricing_premium_name')}
            price={t('pricing_premium_price')}
            priceNote={t('pricing_premium_note')}
            features={premiumFeatures}
            highlighted
            badge={t('pricing_premium_badge')}
            ctaText={t('hero_cta')}
            ctaHref="/auth/login"
            onCtaClick={() => trackPremiumCTAClicked('landing_pricing')}
          />
        </div>
      </div>
    </section>
  )
}
