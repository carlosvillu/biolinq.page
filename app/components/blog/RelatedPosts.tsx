import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { BlogPostMeta } from '~/services/blog-content.server'
import { BlogPostCard } from '~/components/blog/BlogPostCard'
import { useAnalytics } from '~/hooks/useAnalytics'

export function RelatedPosts({ posts }: { posts: BlogPostMeta[] }) {
  const { t } = useTranslation()
  const { trackBlogCTAClicked } = useAnalytics()

  const onCTAClick = () => {
    trackBlogCTAClicked('blog_post_footer')
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      {posts.length > 0 && (
        <>
          {/* Section title */}
          <h2 className="font-bold text-2xl tracking-tight text-dark mb-8">
            {t('blog_related_posts')}
          </h2>

          {/* Related post cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </div>
        </>
      )}

      {/* CTA section */}
      <div className="text-center border-t-[3px] border-dark pt-8">
        <p className="text-lg text-dark/80 mb-4">{t('blog_post_cta_text')}</p>
        <Link to="/" className="inline-block" onClick={onCTAClick}>
          {/* Neo-Brutal button */}
          <div className="relative group cursor-pointer">
            <div className="absolute inset-0 bg-dark rounded translate-x-1 translate-y-1" />
            <div
              className="relative z-10 px-6 py-3 bg-primary text-dark font-bold border-[3px] border-dark rounded
              group-hover:-translate-y-px group-hover:-translate-x-px transition-transform duration-200"
            >
              {t('blog_post_cta_button')}
            </div>
          </div>
        </Link>
      </div>
    </section>
  )
}
