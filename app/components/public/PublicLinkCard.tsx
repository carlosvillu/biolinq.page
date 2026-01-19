import type { Link } from '~/db/schema/links'

type PublicLinkCardProps = {
  link: Pick<Link, 'id' | 'title' | 'url' | 'emoji'>
}

export function PublicLinkCard({ link }: PublicLinkCardProps) {
  return (
    <a
      href={`/go/${link.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block w-full"
    >
      <div
        className="absolute inset-0 bg-dark rounded translate-x-1.5 translate-y-1.5
        transition-transform group-hover:translate-x-2 group-hover:translate-y-2"
      />

      <div
        className="relative z-10 bg-white border-[3px] border-dark rounded p-4
        flex items-center justify-center gap-3
        transition-transform group-hover:-translate-y-0.5 group-hover:-translate-x-0.5"
      >
        {link.emoji && <span className="text-xl">{link.emoji}</span>}
        <span className="font-bold text-lg">{link.title}</span>
      </div>
    </a>
  )
}
