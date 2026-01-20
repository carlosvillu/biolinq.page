export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString()
}

export function formatDayShort(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}
