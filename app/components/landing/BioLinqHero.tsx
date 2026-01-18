import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Sparkle } from './Sparkle'
import { ValuePropCard } from './ValuePropCard'
import { NeoBrutalButton, NeoBrutalCard, NeoBrutalInput } from '~/components/neo-brutal'

export function BioLinqHero() {
  const { t } = useTranslation()

  return (
    <main className="max-w-4xl mx-auto px-4 py-16 md:py-24">
      {/* Hero Section */}
      <div className="text-center mb-16 relative">
        {/* Decorative sparkles */}
        <Sparkle position="top-left" color="accent" />
        <Sparkle position="bottom-right" color="primary" />

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9] mb-6 text-neo-dark">
          Less is more.
          <br />
          <span className="text-gray-500 text-3xl md:text-5xl font-bold tracking-tight block mt-2">
            {t('hero_tagline')}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-10">
          {t('hero_description_part1')}{' '}
          <span className="bg-neo-control px-1 border border-neo-dark text-sm font-mono font-bold">
            &lt;500ms
          </span>
        </p>

        {/* Action Box */}
        <div className="max-w-md mx-auto">
          <NeoBrutalCard>
            <div className="flex flex-col gap-4">
              <NeoBrutalInput placeholder="biolinq.page/usuario" className="text-center" />
              <Link to="/auth/login">
                <NeoBrutalButton variant="accent" className="w-full gap-3">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {t('hero_cta')}
                </NeoBrutalButton>
              </Link>
              <p className="text-xs text-gray-700 font-mono">{t('hero_pricing_note')}</p>
            </div>
          </NeoBrutalCard>
        </div>
      </div>

      {/* Value Props */}
      <div className="grid md:grid-cols-3 gap-6 mt-20">
        <ValuePropCard
          icon="⚡"
          title={t('value_speed_title')}
          description={t('value_speed_desc')}
        />
        <ValuePropCard
          icon="🎨"
          title={t('value_design_title')}
          description={t('value_design_desc')}
        />
        <ValuePropCard
          icon="💸"
          title={t('value_price_title')}
          description={t('value_price_desc')}
          badge="BEST VALUE"
        />
      </div>
    </main>
  )
}
