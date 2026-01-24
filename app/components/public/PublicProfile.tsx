import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import type { Biolink } from '~/db/schema/biolinks'
import type { Link } from '~/db/schema/links'
import { usePageView } from '~/hooks/usePageView'
import { getThemeCSSVariables, getThemeClasses, getThemeShadowStyle } from '~/lib/theme-styles'
import { getThemeById, resolveThemeColors } from '~/lib/themes'
import { LoadTimeIndicator } from './LoadTimeIndicator'
import { PublicLinkCard } from './PublicLinkCard'
import { Watermark } from './Watermark'

type PublicProfileProps = {
  user: {
    name: string | null
    image: string | null
    isPremium: boolean
  }
  biolink: Pick<Biolink, 'id' | 'username' | 'theme' | 'customPrimaryColor' | 'customBgColor'>
  links: Link[]
  isPreview?: boolean
}

export function PublicProfile({ user, biolink, links, isPreview = false }: PublicProfileProps) {
  const { t } = useTranslation()
  usePageView(biolink.id, biolink.username, isPreview)
  const displayName = user.name ?? biolink.username

  const theme = getThemeById(biolink.theme)
  const colors = resolveThemeColors(theme, biolink.customPrimaryColor, biolink.customBgColor)
  const cssVars = getThemeCSSVariables(colors)
  const classes = getThemeClasses(theme.style)
  const avatarShadow = getThemeShadowStyle(theme.style)

  return (
    <main
      className={`min-h-screen flex flex-col items-center px-4 py-12 ${classes.container}`}
      style={{
        ...(cssVars as CSSProperties),
        backgroundColor: 'var(--theme-bg)',
        color: 'var(--theme-text)',
      }}
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div
            className={`w-24 h-24 ${classes.avatar} overflow-hidden flex items-center justify-center mb-4`}
            style={{
              backgroundColor: 'var(--theme-card-bg)',
              borderWidth: theme.style.borderWidth,
              borderStyle: 'solid',
              borderColor: 'var(--theme-border)',
              ...avatarShadow,
            }}
          >
            {user.image ? (
              <img src={user.image} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-black" style={{ color: 'var(--theme-text)' }}>
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <h1 className={`text-2xl ${classes.text} text-center`}>{displayName}</h1>

          <p className="font-mono text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            @{biolink.username}
          </p>
        </div>

        <div className="space-y-4">
          {links.map((link, index) => (
            <PublicLinkCard
              key={link.id}
              link={link}
              theme={theme}
              isPreview={isPreview}
              position={index}
            />
          ))}

          {links.length === 0 && (
            <p className="text-center py-8" style={{ color: 'var(--theme-text-muted)' }}>
              {t('public_no_links')}
            </p>
          )}
        </div>
      </div>

      {!user.isPremium && <Watermark theme={theme} />}

      <LoadTimeIndicator />
    </main>
  )
}
