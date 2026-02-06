import type { LoaderFunctionArgs } from 'react-router'
import {
  getBlogPost,
  getAllBlogPosts,
  getRelatedPosts,
} from '~/services/blog-content.server'
import type { Locale } from '~/lib/i18n'

export async function loader({ request }: LoaderFunctionArgs) {
  if (!process.env.DB_TEST_URL) {
    throw new Response('Not Found', { status: 404 })
  }

  const url = new URL(request.url)
  const action = url.searchParams.get('action')
  const slug = url.searchParams.get('slug')
  const locale = (url.searchParams.get('locale') ?? 'en') as Locale

  switch (action) {
    case 'getPost': {
      if (!slug) {
        return Response.json({ error: 'slug is required' }, { status: 400 })
      }
      try {
        const post = getBlogPost(slug, locale)
        return Response.json(post)
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        )
      }
    }

    case 'getAll': {
      const posts = getAllBlogPosts(locale)
      return Response.json(posts)
    }

    case 'getRelated': {
      if (!slug) {
        return Response.json({ error: 'slug is required' }, { status: 400 })
      }
      const tagsParam = url.searchParams.get('tags')
      const tags = tagsParam ? tagsParam.split(',') : []
      const limit = Number(url.searchParams.get('limit') ?? '3')
      const posts = getRelatedPosts(slug, tags, locale, limit)
      return Response.json(posts)
    }

    default:
      return Response.json({ error: 'Invalid action' }, { status: 400 })
  }
}
