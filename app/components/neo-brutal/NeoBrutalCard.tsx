import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '~/lib/utils'

export interface NeoBrutalCardProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode
  variant?: 'panel' | 'white'
}

export function NeoBrutalCard({
  children,
  variant = 'panel',
  className,
  ...props
}: NeoBrutalCardProps) {
  const variantClasses = {
    panel: 'bg-neo-panel',
    white: 'bg-white',
  }

  return (
    <div className="relative">
      {/* Shadow Layer */}
      <div className="absolute inset-0 bg-neo-dark rounded-xl translate-x-2 translate-y-2" />

      {/* Card Content */}
      <div
        className={cn(
          'relative z-10 border-[3px] border-neo-dark rounded-xl p-6 md:p-8',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  )
}
