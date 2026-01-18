import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Menu } from '@base-ui/react/menu'
import { cn } from '~/lib/utils'

export interface NeoBrutalMenuItemProps extends ComponentPropsWithoutRef<typeof Menu.Item> {
  children: ReactNode
}

export function NeoBrutalMenuItem({ children, className, ...props }: NeoBrutalMenuItemProps) {
  return (
    <Menu.Item
      className={cn(
        'flex items-center px-4 py-2 text-sm font-medium cursor-pointer outline-none',
        'hover:bg-neo-panel transition-colors',
        'data-[highlighted]:bg-neo-panel',
        'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
    </Menu.Item>
  )
}
