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
  disabled,
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
    <div className={cn('relative group inline-block', disabled && 'cursor-not-allowed')}>
      {/* Shadow Layer */}
      <div
        className={cn(
          'absolute inset-0 rounded translate-x-1 translate-y-1 transition-transform',
          disabled
            ? 'bg-gray-300'
            : 'bg-neo-dark group-hover:translate-x-2 group-hover:translate-y-2'
        )}
      />

      {/* Button Face */}
      <Comp
        className={cn(
          'relative z-10 font-bold border-[3px] rounded',
          'transition-transform duration-200 ease-out',
          'flex items-center justify-center',
          disabled
            ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
            : cn(
                'border-neo-dark',
                'group-hover:-translate-y-px group-hover:-translate-x-px',
                'active:translate-x-[2px] active:translate-y-[2px]',
                variantClasses[variant]
              ),
          sizeClasses[size],
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </Comp>
    </div>
  )
}
