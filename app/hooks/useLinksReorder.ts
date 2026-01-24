import { useState, useMemo, useCallback } from 'react'
import { useSubmit, useNavigation, useActionData } from 'react-router'
import { arrayMove } from '@dnd-kit/sortable'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { Link } from '~/db/schema/links'
import { useAnalytics } from '~/hooks/useAnalytics'

interface UseLinksReorderProps {
  links: Link[]
  biolinkId: string
}

export function useLinksReorder({ links, biolinkId }: UseLinksReorderProps) {
  const submit = useSubmit()
  const navigation = useNavigation()
  const actionData = useActionData<{ error?: string }>()
  const { trackLinksReordered } = useAnalytics()

  // Create stable key from links for change detection
  const linksKey = links.map((l) => l.id).join(',')

  // Local reorder state: starts matching server, user changes it via drag
  // When linksKey changes (server update), we reset to server state
  const [localState, setLocalState] = useState(() => ({
    linksKey,
    orderedLinks: links,
  }))

  // If server links changed, reset local state synchronously during render
  // This is the "derived state from props" pattern
  let { orderedLinks } = localState
  if (localState.linksKey !== linksKey) {
    orderedLinks = links
    // Schedule state update for next render (can't call setState during render)
    queueMicrotask(() => {
      setLocalState({
        linksKey,
        orderedLinks: links,
      })
    })
  }

  // Derive isSaving from navigation state - this is the source of truth
  // Check if we're submitting a reorder intent
  const isSaving =
    navigation.state === 'submitting' &&
    navigation.formData?.get('intent') === 'reorder'

  const [activeId, setActiveId] = useState<string | null>(null)

  const originalOrder = useMemo(() => links.map((l) => l.id), [links])

  const hasChanges = useMemo(() => {
    const currentOrder = orderedLinks.map((l) => l.id)
    return JSON.stringify(currentOrder) !== JSON.stringify(originalOrder)
  }, [orderedLinks, originalOrder])

  // Show error if action returned error and we're not actively saving
  const reorderError =
    actionData?.error && !isSaving ? actionData.error : null

  const activeLink = orderedLinks.find((l) => l.id === activeId) ?? null

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event

    if (over && active.id !== over.id) {
      setLocalState((prev) => {
        const oldIndex = prev.orderedLinks.findIndex((l) => l.id === active.id)
        const newIndex = prev.orderedLinks.findIndex((l) => l.id === over.id)
        return {
          ...prev,
          orderedLinks: arrayMove(prev.orderedLinks, oldIndex, newIndex),
        }
      })
    }
  }, [])

  const handleSaveOrder = useCallback(() => {
    const formData = new FormData()
    formData.set('intent', 'reorder')
    formData.set('biolinkId', biolinkId)
    formData.set('linkIds', JSON.stringify(orderedLinks.map((l) => l.id)))

    trackLinksReordered()
    submit(formData, { method: 'post' })
  }, [biolinkId, orderedLinks, submit, trackLinksReordered])

  return {
    orderedLinks,
    activeId,
    activeLink,
    hasChanges,
    isSaving,
    reorderError,
    handleDragStart,
    handleDragEnd,
    handleSaveOrder,
  }
}
