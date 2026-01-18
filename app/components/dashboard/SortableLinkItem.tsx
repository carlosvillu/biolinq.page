import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Link } from '~/db/schema/links'
import { LinkItem } from './LinkItem'

interface SortableLinkItemProps {
  link: Link
}

export function SortableLinkItem({ link }: SortableLinkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <LinkItem link={link} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}
