import { useTranslation } from 'react-i18next'
import { Sparkle } from './Sparkle'
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
    <main className="max-w-5xl mx-auto px-4 py-16 md:py-24">
      {/* Hero Section */}
      <div className="relative">
        {/* Decorative sparkles */}
        <Sparkle position="top-left" color="accent" />
        <Sparkle position="bottom-right" color="primary" />

        {/* Centered Content */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-[0.95] mb-6 text-neo-dark">
            {t('hero_headline')}
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg text-gray-700 mb-8"
            dangerouslySetInnerHTML={{ __html: t('hero_subheadline') }}
          />

          {/* Action Box - Centered */}
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
            <p className="mt-4 text-sm text-gray-600">⏱️ {t('hero_setup_note')}</p>
          </div>
        </div>

        {/* Video - Full Width Below */}
        <div className="max-w-3xl mx-auto">
          <div className="border-3 border-neo-dark shadow-neo rounded-xl overflow-hidden">
            <video src="/promo.mp4" autoPlay muted loop playsInline className="w-full h-auto" />
          </div>
        </div>
      </div>
    </main>
  )
}
