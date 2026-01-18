import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '~/lib/utils'

export interface NeoBrutalButtonProps extends ComponentPropsWithoutRef<'button'> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  asChild?: boolean
}

export function NeoBrutalButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  asChild = false,
  ...props
}: NeoBrutalButtonProps) {
  const Comp = asChild ? Slot : 'button'

  const variantClasses = {
    primary: 'bg-neo-primary text-neo-dark',
    secondary: 'bg-white text-neo-dark',
    accent: 'bg-neo-accent text-white',
  }

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <div className="relative group inline-block">
      {/* Shadow Layer */}
      <div
        className="absolute inset-0 bg-neo-dark rounded translate-x-1 translate-y-1
          transition-transform group-hover:translate-x-2 group-hover:translate-y-2"
      />

      {/* Button Face */}
      <Comp
        className={cn(
          'relative z-10 font-bold border-[3px] border-neo-dark rounded',
          'transition-transform duration-200 ease-out',
          'group-hover:-translate-y-px group-hover:-translate-x-px',
          'active:translate-x-[2px] active:translate-y-[2px]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'flex items-center justify-center',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    </div>
  )
}
