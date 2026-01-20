interface StatItemProps {
  label: string
  value: string
}

export function StatItem({ label, value }: StatItemProps) {
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{label}</h3>
      <p className="text-3xl font-black mt-1">{value}</p>
    </div>
  )
}
