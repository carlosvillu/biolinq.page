import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { Link } from '~/db/schema/links'
import { useLinksReorder } from '~/hooks/useLinksReorder'
import { NeoBrutalCard } from '../neo-brutal/NeoBrutalCard'
import { NeoBrutalButton } from '../neo-brutal/NeoBrutalButton'
import { SortableLinkItem } from './SortableLinkItem'
import { LinkItemOverlay } from './LinkItemOverlay'
import { AddLinkDialog } from './AddLinkDialog'

interface LinksListProps {
  links: Link[]
  biolinkId: string
  maxLinks: number
  error?: string
}

export function LinksList({ links, biolinkId, maxLinks, error }: LinksListProps) {
  const { t } = useTranslation()
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const {
    orderedLinks,
    activeLink,
    hasChanges,
    isSaving,
    reorderError,
    handleDragStart,
    handleDragEnd,
    handleSaveOrder,
  } = useLinksReorder({ links, biolinkId })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const sortableItems = useMemo(() => orderedLinks.map((l) => l.id), [orderedLinks])

  const canAddMore = orderedLinks.length < maxLinks
  const displayError = error || reorderError

  return (
    <>
      <NeoBrutalCard variant="panel">
        <header className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {t('dashboard_my_links')} ({orderedLinks.length}/{maxLinks})
          </h2>

          {hasChanges ? (
            <NeoBrutalButton
              variant="primary"
              size="sm"
              onClick={handleSaveOrder}
              disabled={isSaving}
            >
              {isSaving ? <span className="inline-block animate-spin mr-2">⏳</span> : null}
              {isSaving ? t('saving') : t('dashboard_save_order')}
            </NeoBrutalButton>
          ) : null}
        </header>

        {displayError ? (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-400 rounded text-red-700 text-sm">
            {t(`links_error_${displayError.toLowerCase()}`, displayError)}
          </div>
        ) : null}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {orderedLinks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">{t('dashboard_no_links')}</div>
              ) : (
                orderedLinks.map((link) => <SortableLinkItem key={link.id} link={link} />)
              )}
            </div>
          </SortableContext>

          <DragOverlay>{activeLink ? <LinkItemOverlay link={activeLink} /> : null}</DragOverlay>
        </DndContext>

        <div className="mt-6">
          <NeoBrutalButton
            onClick={() => setAddDialogOpen(true)}
            disabled={!canAddMore}
            className="w-full"
          >
            + {t('dashboard_add_link')}
          </NeoBrutalButton>
        </div>
      </NeoBrutalCard>

      <AddLinkDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} biolinkId={biolinkId} />
    </>
  )
}
