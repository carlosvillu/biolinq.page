import * as React from 'react'

import { cn } from '~/lib/utils'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full bg-pearl border border-silver px-4 py-3 text-ink placeholder:text-slate focus-visible:outline-none focus-visible:border-ink disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
