export interface PricingFeature {
  text: string
  included: boolean
}

export interface PricingCardProps {
  name: string
  price: string
  priceNote: string
  features: PricingFeature[]
  highlighted?: boolean
  badge?: string
  ctaText?: string
  ctaHref?: string
}

export function PricingCard({
  name,
  price,
  priceNote,
  features,
  highlighted = false,
  badge,
  ctaText,
  ctaHref,
}: PricingCardProps) {
  return (
    <div
      className={`relative border-[3px] border-neo-dark rounded-xl p-6 md:p-8 ${
        highlighted ? 'bg-neo-primary' : 'bg-white'
      } ${highlighted ? 'md:scale-105' : ''}`}
    >
      {badge && (
        <span className="inline-block -rotate-6 px-2 py-1 bg-neo-accent border-2 border-neo-dark text-white text-[10px] font-bold shadow-hard absolute -top-3 -right-2">
          {badge}
        </span>
      )}

      {/* Plan Name */}
      <div className="font-mono text-sm font-bold mb-2 text-neo-dark">{name}</div>

      {/* Price */}
      <div className="font-bold text-4xl md:text-5xl mb-1 text-neo-dark tracking-tight">
        {price}
      </div>
      <p className="text-gray-700 text-sm mb-6">{priceNote}</p>

      {/* Features List */}
      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-neo-dark">
            <span className={feature.included ? 'text-green-600' : 'text-gray-400'}>
              {feature.included ? '✓' : '✗'}
            </span>
            <span className={feature.included ? '' : 'text-gray-400 line-through'}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      {ctaText && (
        <div className="relative group cursor-pointer mt-6">
          <div className="absolute inset-0 bg-neo-dark rounded translate-x-1 translate-y-1" />
          <a
            href={ctaHref}
            className="relative z-10 w-full py-3 bg-neo-accent text-white border-[3px] border-neo-dark rounded font-bold group-hover:-translate-y-px group-hover:-translate-x-px transition-transform duration-200 block text-center"
          >
            {ctaText}
          </a>
        </div>
      )}
    </div>
  )
}
