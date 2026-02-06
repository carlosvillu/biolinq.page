import { useTranslation } from 'react-i18next'
import type { BlogPostMeta } from '~/services/blog-content.server'

export function BlogPostLayout({ html, meta }: { html: string; meta: BlogPostMeta }) {
  const { t } = useTranslation()

  const formattedDate = new Date(meta.date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      {/* Post header section */}
      <header className="bg-panel border-b-[3px] border-dark">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
          {/* Tags as badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {meta.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-xs font-bold px-2 py-0.5 bg-input border-2 border-dark rounded"
              >
                {tag.toUpperCase()}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="font-bold text-3xl md:text-4xl tracking-tighter text-dark mb-4">
            {meta.title}
          </h1>

          {/* Meta line: author, date, reading time */}
          <div className="flex flex-wrap items-center gap-3 text-sm font-mono text-dark/60">
            <span>{meta.author}</span>
            <span>&bull;</span>
            <time dateTime={meta.date}>{formattedDate}</time>
            <span>&bull;</span>
            <span>
              {meta.readingTime} {t('blog_min_read')}
            </span>
          </div>
        </div>
      </header>

      {/* Content area (Neo-Brutal card) */}
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="relative">
          {/* Shadow Layer */}
          <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-xl bg-dark" />
          {/* Content Card */}
          <article className="relative z-10 rounded-xl border-[3px] border-dark bg-panel p-6 md:p-8">
            <div className="neo-article" dangerouslySetInnerHTML={{ __html: html }} />
          </article>
        </div>
      </main>
    </>
  )
}
