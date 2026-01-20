import { useTranslation } from 'react-i18next'
import { NeoBrutalCard } from '../neo-brutal/NeoBrutalCard'
import { PremiumLock } from './PremiumLock'
import { LinkMeter } from './LinkMeter'
import { getMaxValue } from '~/lib/stats'
import type { LinkBreakdown } from '~/services/analytics.server'

interface LinkPerformanceProps {
  links: LinkBreakdown[]
  isPremium: boolean
}

export function LinkPerformance({ links, isPremium }: LinkPerformanceProps) {
  const { t } = useTranslation()

  const maxClicks = getMaxValue(links, 'totalClicks')

  return (
    <NeoBrutalCard variant="white">
      <h3 className="font-bold mb-4">{t('stats_link_performance')}</h3>

      <div className="relative min-h-[60px]">
        {!isPremium && <PremiumLock />}

        {links.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('stats_no_links')}</p>
        ) : (
          <div className="space-y-3">
            {links.map((link) => (
              <LinkMeter
                key={link.linkId}
                emoji={link.emoji}
                title={link.title}
                clicks={link.totalClicks}
                maxClicks={maxClicks}
              />
            ))}
          </div>
        )}
      </div>
    </NeoBrutalCard>
  )
}
