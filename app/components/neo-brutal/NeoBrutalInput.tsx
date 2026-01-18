import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { cn } from '~/lib/utils'

export type NeoBrutalInputProps = ComponentPropsWithoutRef<'input'>

export const NeoBrutalInput = forwardRef<HTMLInputElement, NeoBrutalInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative">
        {/* Shadow Layer */}
        <div className="absolute inset-0 bg-neo-dark rounded translate-x-1 translate-y-1" />

        {/* Input Field */}
        <input
          ref={ref}
          className={cn(
            'relative z-10 w-full px-4 py-3',
            'bg-neo-input border-[3px] border-neo-dark rounded',
            'font-medium text-neo-dark focus:outline-none focus:ring-2 focus:ring-neo-primary',
            'placeholder-gray-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
      </div>
    )
  }
)

NeoBrutalInput.displayName = 'NeoBrutalInput'
