import { cn } from '~/lib/utils'

export interface SparkleProps {
  position: 'top-left' | 'bottom-right'
  color: 'accent' | 'primary'
}

const positionClasses = {
  'top-left': 'absolute top-0 left-10 md:left-32 -translate-y-full',
  'bottom-right': 'absolute bottom-0 right-10 md:right-32 translate-y-full',
}

const colorClasses = {
  accent: 'text-neo-accent',
  primary: 'text-neo-primary',
}

export function Sparkle({ position, color }: SparkleProps) {
  return (
    <svg
      className={cn(
        positionClasses[position],
        colorClasses[color],
        'w-8 h-8 md:w-12 md:h-12 animate-pulse'
      )}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  )
}
