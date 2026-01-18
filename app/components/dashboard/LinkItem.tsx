import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Link } from '~/db/schema/links'
import { DeleteLinkDialog } from './DeleteLinkDialog'
import { DragHandleIcon } from './DragHandleIcon'

interface LinkItemProps {
  link: Link
  dragHandleProps?: Record<string, unknown>
}

export function LinkItem({ link, dragHandleProps }: LinkItemProps) {
  const { t } = useTranslation()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Extract domain from URL for display
  let displayUrl = link.url
  try {
    const url = new URL(link.url)
    displayUrl = url.hostname
  } catch {
    // If URL parsing fails, use the full URL
  }

  return (
    <>
      <div className="relative group" data-testid="link-item">
        {/* Shadow layer */}
        <div className="absolute inset-0 bg-white border-[3px] border-neo-dark rounded translate-y-1 translate-x-1" />

        {/* Card content */}
        <div className="relative bg-white border-[3px] border-neo-dark rounded p-3 flex gap-3 items-center">
          {/* Drag Handle */}
          {dragHandleProps ? (
            <button
              type="button"
              className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-neo-dark touch-none"
              {...dragHandleProps}
              aria-label={t('dashboard_drag_link')}
            >
              <DragHandleIcon className="w-5 h-5" />
            </button>
          ) : null}

          {/* Emoji display */}
          <div className="w-10 h-10 bg-neo-input border-2 border-neo-dark rounded flex items-center justify-center text-xl flex-shrink-0">
            {link.emoji || '🔗'}
          </div>

          {/* Link info */}
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate">{link.title}</p>
            <p className="text-xs font-mono text-gray-500 truncate">{displayUrl}</p>
          </div>

          {/* Delete button */}
          <button
            onClick={() => setDeleteDialogOpen(true)}
            className="text-gray-400 hover:text-neo-accent p-2 flex-shrink-0 transition-colors"
            aria-label={t('dashboard_delete_link')}
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      <DeleteLinkDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        linkId={link.id}
        linkTitle={link.title}
      />
    </>
  )
}
