import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { BlogPostMeta } from '~/services/blog-content.server'

export function BlogPostCard({ post }: { post: BlogPostMeta }) {
  const { t } = useTranslation()

  const formattedDate = new Date(post.date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Link to={`/blog/${post.slug}`} className="block group">
      <div className="relative">
        {/* Shadow Layer */}
        <div
          className="absolute inset-0 bg-dark rounded-xl translate-x-2 translate-y-2
            transition-transform group-hover:translate-x-2.5 group-hover:translate-y-2.5"
        />
        {/* Card Face */}
        <div
          className="relative z-10 border-[3px] border-dark rounded-xl bg-white overflow-hidden
            group-hover:-translate-y-0.5 group-hover:-translate-x-0.5 transition-transform duration-200"
        >
          {/* Cover Image */}
          {post.coverImage && (
            <div className="aspect-video overflow-hidden border-b-[3px] border-dark">
              <img
                src={post.coverImage}
                alt={post.coverAlt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-5 md:p-6">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-xs font-bold px-2 py-0.5 bg-input border-2 border-dark rounded"
                >
                  {tag.toUpperCase()}
                </span>
              ))}
            </div>

            {/* Title */}
            <h2 className="font-bold text-xl mb-2 text-dark">{post.title}</h2>

            {/* Description */}
            <p className="text-dark/80 text-sm mb-4 line-clamp-2">{post.description}</p>

            {/* Meta: date + reading time */}
            <div className="flex items-center gap-3 text-xs font-mono text-dark/60">
              <time dateTime={post.date}>{formattedDate}</time>
              <span>&bull;</span>
              <span>
                {post.readingTime} {t('blog_min_read')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
