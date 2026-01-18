export interface ValuePropCardProps {
  icon: string
  title: string
  description: string
  badge?: string
}

export function ValuePropCard({ icon, title, description, badge }: ValuePropCardProps) {
  return (
    <div className="border-[3px] border-neo-dark bg-white p-6 rounded shadow-hard relative">
      {badge && (
        <span className="inline-block -rotate-6 -translate-y-1 px-1.5 py-0.5 bg-neo-accent border border-neo-dark text-white text-[10px] font-bold shadow-hard absolute -top-3 -right-2">
          {badge}
        </span>
      )}
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-bold text-lg mb-2 text-neo-dark tracking-tight">{title}</h3>
      <p className="text-gray-700">{description}</p>
    </div>
  )
}
