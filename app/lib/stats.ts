import type { DailyDataPoint } from '~/services/analytics.server'

export function calculatePercentage(value: number, max: number): number {
  if (max === 0) return 0
  return Math.round((value / max) * 100)
}

export function getMaxValue<T>(dataPoints: T[], key: keyof T): number {
  if (dataPoints.length === 0) return 1
  const values = dataPoints.map((d) => Number(d[key]) || 0)
  return Math.max(...values, 1)
}

export function getLast7Days(): string[] {
  const dates: string[] = []
  const today = new Date()

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
  }

  return dates
}

export function fillMissingDays(
  data: DailyDataPoint[],
  days: string[]
): DailyDataPoint[] {
  const dataMap = new Map(data.map((d) => [d.date, d]))

  return days.map((date) => {
    const existing = dataMap.get(date)
    if (existing) return existing
    return { date, views: 0, clicks: 0 }
  })
}
