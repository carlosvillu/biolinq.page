import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Menu } from '@base-ui/react/menu'
import { cn } from '~/lib/utils'

export interface NeoBrutalMenuRadioItemProps
  extends ComponentPropsWithoutRef<typeof Menu.RadioItem> {
  children: ReactNode
  value: string
}

export function NeoBrutalMenuRadioItem({
  value,
  children,
  className,
  ...props
}: NeoBrutalMenuRadioItemProps) {
  return (
    <Menu.RadioItem
      value={value}
      className={cn(
        'px-4 py-2 text-sm font-medium cursor-pointer flex items-center gap-2 outline-none',
        'hover:bg-neo-panel transition-colors',
        'data-[highlighted]:bg-neo-panel',
        'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
        className
      )}
      {...props}
    >
      <Menu.RadioItemIndicator className="w-4 h-4 flex items-center justify-center">
        <span className="w-2 h-2 rounded-full bg-neo-dark" />
      </Menu.RadioItemIndicator>
      {children}
    </Menu.RadioItem>
  )
}
