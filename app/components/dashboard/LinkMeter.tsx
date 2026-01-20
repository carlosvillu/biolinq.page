import { useTranslation } from 'react-i18next'
import { Meter } from '@base-ui/react/meter'
import { calculatePercentage } from '~/lib/stats'
import { formatNumber } from '~/lib/format'

interface LinkMeterProps {
  emoji: string | null
  title: string
  clicks: number
  maxClicks: number
}

export function LinkMeter({ emoji, title, clicks, maxClicks }: LinkMeterProps) {
  const { t } = useTranslation()
  const percentage = calculatePercentage(clicks, maxClicks)

  return (
    <Meter.Root value={percentage} className="space-y-1">
      <div className="flex justify-between items-center gap-2">
        <Meter.Label className="text-sm font-medium truncate flex-1 min-w-0">
          {emoji && <span className="mr-1">{emoji}</span>}
          {title}
        </Meter.Label>
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {formatNumber(clicks)} {t('stats_clicks_label')}
        </span>
      </div>
      <Meter.Track className="h-2 bg-gray-100 border border-neo-dark rounded-sm overflow-hidden shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
        <Meter.Indicator
          className="h-full bg-neo-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </Meter.Track>
    </Meter.Root>
  )
}
