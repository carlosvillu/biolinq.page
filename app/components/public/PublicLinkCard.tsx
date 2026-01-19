import type { Link } from '~/db/schema/links'

type PublicLinkCardProps = {
  link: Pick<Link, 'id' | 'title' | 'url' | 'emoji'>
  isPreview?: boolean
}

export function PublicLinkCard({ link, isPreview = false }: PublicLinkCardProps) {
  return (
    <a
      href={isPreview ? link.url : `/go/${link.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block w-full"
    >
      {/* Shadow Layer - Neo-Brutal offset */}
      <div
        className="absolute inset-0 bg-neo-dark rounded translate-x-2 translate-y-2
        transition-transform duration-200 ease-out
        group-hover:translate-x-3 group-hover:translate-y-3"
      />

      {/* Card Face - Lifts on hover, presses on active */}
      <div
        className="relative z-10 bg-white border-[3px] border-neo-dark rounded py-5 px-6
        flex items-center justify-center gap-3
        transition-transform duration-200 ease-out
        group-hover:-translate-y-1 group-hover:-translate-x-1
        group-active:translate-x-1 group-active:translate-y-1"
      >
        {link.emoji && <span className="text-2xl">{link.emoji}</span>}
        <span className="font-bold text-lg tracking-tight">{link.title}</span>
      </div>
    </a>
  )
}
