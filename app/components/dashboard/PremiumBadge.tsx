interface PremiumBadgeProps {
  isPremium: boolean
}

export function PremiumBadge({ isPremium }: PremiumBadgeProps) {
  if (isPremium) {
    return (
      <span className="bg-neo-dark text-neo-primary px-2 py-0.5 rounded-sm text-xs font-bold font-mono tracking-wider">
        PREMIUM
      </span>
    )
  }

  return (
    <span className="bg-gray-200 text-[10px] px-1 border border-neo-dark font-mono">
      FREE
    </span>
  )
}
