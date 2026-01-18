import { useTranslation } from 'react-i18next'
import { Sparkle } from './Sparkle'
import { ValuePropCard } from './ValuePropCard'
import { NeoBrutalButton, NeoBrutalCard, NeoBrutalInput } from '~/components/neo-brutal'
import { useUsernameClaim } from '~/hooks/useUsernameClaim'

type BioLinqHeroProps = {
  initialError?: string | null
}

export function BioLinqHero({ initialError }: BioLinqHeroProps) {
  const { t } = useTranslation()
  const { username, setUsername, handleClaim, state, error } = useUsernameClaim()

  const isLoading = state === 'checking' || state === 'claiming' || state === 'redirecting'
  const buttonText =
    state === 'checking'
      ? t('username_checking')
      : state === 'claiming'
        ? t('username_claiming')
        : state === 'redirecting'
          ? t('username_redirecting')
          : t('hero_cta')

  const displayError = error?.message
    ? error.message
    : initialError
      ? t(`username_error_${initialError.toLowerCase()}`)
      : null

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
              <NeoBrutalInput
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="username"
                prefix="biolinq.page/"
                className="text-left font-mono"
                disabled={isLoading}
              />
              {displayError ? (
                <p className="text-neo-accent text-sm font-medium">{displayError}</p>
              ) : null}
              <NeoBrutalButton
                type="button"
                variant="accent"
                className="w-full"
                onClick={handleClaim}
                disabled={isLoading || username.length === 0}
              >
                {buttonText}
              </NeoBrutalButton>
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
