import { useState } from 'react'

export type EpisodeSelectionMode = 'single' | 'multiple'

interface UseEpisodeSelectionOptions<TEpisode extends { id: string }> {
  episodes: TEpisode[]
  initialSelectedId?: string | null
  mode: EpisodeSelectionMode
  maxSelected?: number | null
}

interface UseEpisodeSelectionResult {
  selectedEpisodeIds: string[]
  selectEpisode: (id: string) => void
  clearSelection: () => void
}

export function useEpisodeSelection<TEpisode extends { id: string }>(
  options: UseEpisodeSelectionOptions<TEpisode>
): UseEpisodeSelectionResult {
  const { initialSelectedId, mode, maxSelected } = options

  const getInitialSelection = () => {
    if (mode === 'single' && initialSelectedId) {
      return [initialSelectedId]
    }
    return []
  }

  const [selectedIds, setSelectedIds] = useState<string[]>(getInitialSelection)

  const selectEpisode = (id: string) => {
    if (mode === 'single') {
      setSelectedIds([id])
      return
    }

    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((existingId) => existingId !== id)
      }

      if (typeof maxSelected === 'number' && maxSelected > 0 && prev.length >= maxSelected) {
        return prev
      }

      return [...prev, id]
    })
  }

  const clearSelection = () => {
    setSelectedIds([])
  }

  return {
    selectedEpisodeIds: selectedIds,
    selectEpisode,
    clearSelection,
  }
}
