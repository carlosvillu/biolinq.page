import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Menu } from '@base-ui/react/menu'
import { cn } from '~/lib/utils'

export interface NeoBrutalMenuPopupProps extends ComponentPropsWithoutRef<typeof Menu.Popup> {
  children: ReactNode
}

export function NeoBrutalMenuPopup({ children, className, ...props }: NeoBrutalMenuPopupProps) {
  return (
    <Menu.Portal>
      <Menu.Positioner sideOffset={8} className="z-50">
        <Menu.Popup
          className={cn(
            'bg-white text-neo-dark border-[3px] border-neo-dark rounded shadow-hard-lg',
            'py-2 min-w-[180px]',
            'data-[starting-style]:animate-in data-[starting-style]:fade-in-0 data-[starting-style]:zoom-in-95',
            'data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[ending-style]:zoom-out-95',
            className
          )}
          {...props}
        >
          {children}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  )
}
