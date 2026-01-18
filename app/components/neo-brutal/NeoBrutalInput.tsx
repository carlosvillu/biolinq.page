import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { cn } from '~/lib/utils'

export type NeoBrutalInputProps = ComponentPropsWithoutRef<'input'> & {
  prefix?: string
}

export const NeoBrutalInput = forwardRef<HTMLInputElement, NeoBrutalInputProps>(
  ({ className, prefix, ...props }, ref) => {
    return (
      <div className="relative">
        {/* Shadow Layer */}
        <div className="absolute inset-0 bg-neo-dark rounded translate-x-1 translate-y-1" />

        {/* Input Field Container */}
        <div
          className={cn(
            'relative z-10 flex items-center w-full',
            'bg-neo-input border-[3px] border-neo-dark rounded',
            'focus-within:ring-2 focus-within:ring-neo-primary'
          )}
        >
          {prefix ? (
            <span className="pl-4 text-gray-500 font-mono text-sm select-none whitespace-nowrap">
              {prefix}
            </span>
          ) : null}
          <input
            ref={ref}
            className={cn(
              'flex-1 py-3 bg-transparent',
              'font-medium text-neo-dark focus:outline-none',
              'placeholder-gray-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              prefix ? 'pl-1 pr-4' : 'px-4',
              className
            )}
            {...props}
          />
        </div>
      </div>
    )
  }
)

NeoBrutalInput.displayName = 'NeoBrutalInput'
