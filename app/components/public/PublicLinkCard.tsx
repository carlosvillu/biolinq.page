import type { Link } from '~/db/schema/links'
import { getThemeBorderStyle, getThemeClasses, getThemeShadowStyle } from '~/lib/theme-styles'
import type { Theme } from '~/lib/themes'
import { useAnalytics } from '~/hooks/useAnalytics'

type PublicLinkCardProps = {
  link: Pick<Link, 'id' | 'title' | 'url' | 'emoji'>
  theme: Theme
  isPreview?: boolean
  position: number
  userMeasurementId?: string
}

export function PublicLinkCard({
  link,
  theme,
  isPreview = false,
  position,
  userMeasurementId,
}: PublicLinkCardProps) {
  const { trackLinkClicked, trackUserLinkClick } = useAnalytics()
  const classes = getThemeClasses(theme.style)
  const shadowStyle = getThemeShadowStyle(theme.style)
  const borderClass = getThemeBorderStyle(theme.style)
  const useShadowLayer = theme.style.shadowType === 'hard'

  const handleClick = () => {
    if (isPreview) return

    // Track internally for BioLinq analytics
    trackLinkClicked(link.id, position)

    // Track to user's GA4 if configured (premium feature)
    if (userMeasurementId) {
      trackUserLinkClick(userMeasurementId, link.url, link.title, position + 1)
    }
  }

  return (
    <a
      href={isPreview ? link.url : `/go/${link.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block w-full"
      onClick={handleClick}
    >
      {/* Shadow Layer - Only for hard shadow themes (brutalist) */}
      {useShadowLayer && (
        <div
          className={`absolute inset-0 ${classes.card} transition-transform duration-200`}
          style={{
            backgroundColor: 'var(--theme-shadow)',
            transform: `translate(${theme.style.shadowOffset.split(' ').join(', ')})`,
          }}
        />
      )}

      {/* Card Face */}
      <div
        className={`relative z-10 ${classes.card} ${borderClass} py-5 px-6
          flex items-center justify-center gap-3
          transition-all duration-200 ease-out
          ${classes.cardHover}
          group-active:translate-x-1 group-active:translate-y-1`}
        style={{
          backgroundColor: 'var(--theme-card-bg)',
          borderColor: 'var(--theme-border)',
          ...(!useShadowLayer ? shadowStyle : {}),
        }}
      >
        {link.emoji && <span className="text-2xl">{link.emoji}</span>}
        <span className={`${classes.text} text-lg tracking-tight`}>{link.title}</span>
      </div>
    </a>
  )
}
