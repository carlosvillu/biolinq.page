import { Avatar } from '@base-ui/react/avatar'
import { cn } from '~/lib/utils'

interface DashboardAvatarProps {
  src: string | null
  fallback: string
  size?: 'sm' | 'md'
}

export function DashboardAvatar({
  src,
  fallback,
  size = 'sm',
}: DashboardAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
  }

  return (
    <Avatar.Root
      className={cn(
        'rounded-full bg-gray-300 border-2 border-neo-dark overflow-hidden',
        sizeClasses[size]
      )}
    >
      {src && (
        <Avatar.Image src={src} className="w-full h-full object-cover" />
      )}
      <Avatar.Fallback className="flex items-center justify-center w-full h-full font-bold">
        {fallback.toUpperCase()}
      </Avatar.Fallback>
    </Avatar.Root>
  )
}
