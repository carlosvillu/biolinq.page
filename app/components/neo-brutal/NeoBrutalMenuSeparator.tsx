import { Menu } from '@base-ui/react/menu'
import { cn } from '~/lib/utils'

export function NeoBrutalMenuSeparator({ className }: { className?: string }) {
  return <Menu.Separator className={cn('h-px bg-neo-dark my-2', className)} />
}
