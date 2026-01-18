import { useTranslation } from 'react-i18next'
import { NeoBrutalCard } from '../neo-brutal/NeoBrutalCard'
import { formatNumber } from '~/lib/format'
import { cn } from '~/lib/utils'

interface StatsCardProps {
  totalViews: number
  isPremium: boolean
}

export function StatsCard({ totalViews, isPremium }: StatsCardProps) {
  const { t } = useTranslation()

  return (
    <NeoBrutalCard variant="white">
      <div className="flex justify-between items-center py-4">
        {/* Total Views (visible for all) */}
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            {t('dashboard_total_views')}
          </h3>
          <p className="text-3xl font-black mt-1">{formatNumber(totalViews)}</p>
        </div>

        {/* Clicks (locked for free users) */}
        <div
          className={cn(
            'text-right relative',
            !isPremium && 'opacity-50 blur-[1px] select-none cursor-not-allowed'
          )}
        >
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            {t('dashboard_clicks')}
          </h3>
          <p className="text-3xl font-black mt-1">---</p>

          {!isPremium && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-neo-accent text-white text-xs font-bold px-2 py-1 border border-neo-dark shadow-sm">
                PREMIUM
              </span>
            </div>
          )}
        </div>
      </div>
    </NeoBrutalCard>
  )
}
