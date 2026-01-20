import { useTranslation } from 'react-i18next'
import { NeoBrutalCard } from '../neo-brutal/NeoBrutalCard'
import { PremiumLock } from './PremiumLock'
import { DayBar } from './DayBar'
import { getMaxValue } from '~/lib/stats'
import type { DailyDataPoint } from '~/services/analytics.server'

interface DailyChartProps {
  data: DailyDataPoint[]
  isPremium: boolean
}

export function DailyChart({ data, isPremium }: DailyChartProps) {
  const { t } = useTranslation()

  const maxViews = getMaxValue(data, 'views')
  const maxClicks = getMaxValue(data, 'clicks')

  return (
    <NeoBrutalCard variant="white">
      <h3 className="font-bold mb-4">{t('stats_daily_activity')}</h3>

      <div className="relative">
        {!isPremium && <PremiumLock />}

        <div className="flex items-end justify-between gap-2 h-32">
          {data.map((day) => (
            <DayBar
              key={day.date}
              date={day.date}
              views={day.views}
              clicks={day.clicks}
              maxViews={maxViews}
              maxClicks={maxClicks}
            />
          ))}
        </div>

        <div className="flex gap-4 mt-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-neo-primary border border-neo-dark" />
            {t('stats_views')}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-neo-input border border-neo-dark" />
            {t('stats_clicks')}
          </span>
        </div>
      </div>
    </NeoBrutalCard>
  )
}
