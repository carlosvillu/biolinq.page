import type { Link } from '~/db/schema/links'
import { DragHandleIcon } from './DragHandleIcon'

interface LinkItemOverlayProps {
  link: Link
}

export function LinkItemOverlay({ link }: LinkItemOverlayProps) {
  let displayUrl = link.url
  try {
    const url = new URL(link.url)
    displayUrl = url.hostname
  } catch {
    // If URL parsing fails, use the full URL
  }

  return (
    <div className="relative">
      {/* Shadow layer */}
      <div className="absolute inset-0 bg-neo-dark rounded translate-y-1 translate-x-1" />

      {/* Card content (simplified, no buttons) */}
      <div className="relative bg-white border-[3px] border-neo-dark rounded p-3 flex gap-3 items-center min-w-[300px]">
        {/* Drag Handle (visual) */}
        <div className="p-1 text-neo-dark">
          <DragHandleIcon className="w-5 h-5" />
        </div>

        {/* Emoji */}
        <div className="w-10 h-10 bg-neo-input border-2 border-neo-dark rounded flex items-center justify-center text-xl flex-shrink-0">
          {link.emoji || '🔗'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate">{link.title}</p>
          <p className="text-xs font-mono text-gray-500 truncate">
            {displayUrl}
          </p>
        </div>
      </div>
    </div>
  )
}
