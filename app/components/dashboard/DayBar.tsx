import { calculatePercentage } from '~/lib/stats'
import { formatDayShort } from '~/lib/format'

interface DayBarProps {
  date: string
  views: number
  clicks: number
  maxViews: number
  maxClicks: number
}

export function DayBar({ date, views, clicks, maxViews, maxClicks }: DayBarProps) {
  const viewsHeight = calculatePercentage(views, maxViews)
  const clicksHeight = calculatePercentage(clicks, maxClicks)
  const dayLabel = formatDayShort(date)

  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      <div className="flex gap-0.5 items-end h-24 w-full justify-center">
        <div
          className="w-3 bg-neo-primary border border-neo-dark rounded-t-sm transition-all"
          style={{ height: `${Math.max(viewsHeight, 4)}%` }}
          title={`${views} views`}
        />
        <div
          className="w-3 bg-neo-input border border-neo-dark rounded-t-sm transition-all"
          style={{ height: `${Math.max(clicksHeight, 4)}%` }}
          title={`${clicks} clicks`}
        />
      </div>
      <span className="text-xs mt-1 text-gray-500">{dayLabel}</span>
    </div>
  )
}
