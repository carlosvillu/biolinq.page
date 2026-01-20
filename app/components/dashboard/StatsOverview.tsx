import { useTranslation } from 'react-i18next'
import { NeoBrutalCard } from '../neo-brutal/NeoBrutalCard'
import { formatNumber } from '~/lib/format'
import { PremiumLock } from './PremiumLock'
import { StatItem } from './StatItem'

interface StatsOverviewProps {
  totalViews: number
  totalClicks: number | null
  isPremium: boolean
}

export function StatsOverview({ totalViews, totalClicks, isPremium }: StatsOverviewProps) {
  const { t } = useTranslation()

  return (
    <NeoBrutalCard variant="white">
      <div className="grid grid-cols-2 gap-4 py-4">
        <StatItem label={t('dashboard_total_views')} value={formatNumber(totalViews)} />

        <div className="relative text-right">
          <StatItem
            label={t('dashboard_total_clicks')}
            value={isPremium && totalClicks !== null ? formatNumber(totalClicks) : '---'}
          />
          {!isPremium && <PremiumLock />}
        </div>
      </div>
    </NeoBrutalCard>
  )
}
