import { PassThrough } from 'node:stream'

import type { AppLoadContext, EntryContext } from 'react-router'
import { createReadableStreamFromReadable } from '@react-router/node'
import { ServerRouter } from 'react-router'
import { isbot } from 'isbot'
import type { RenderToPipeableStreamOptions } from 'react-dom/server'
import { renderToPipeableStream } from 'react-dom/server'
import { isValidLocale } from '~/lib/i18n'
import { getBlogPostRawMarkdown } from '~/services/blog-content.server'

export const streamTimeout = 5_000

const BLOG_CACHE_CONTROL = 'public, max-age=3600, s-maxage=86400'

function getBlogMarkdownResponse(request: Request): Response | null {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return null
  }

  const contentTypeHeader = request.headers.get('content-type')?.toLowerCase() ?? ''
  const acceptHeader = request.headers.get('accept')?.toLowerCase() ?? ''
  const wantsMarkdown =
    contentTypeHeader.includes('text/markdown') || acceptHeader.includes('text/markdown')

  if (!wantsMarkdown) {
    return null
  }

  const pathname = new URL(request.url).pathname
  const match = pathname.match(/^\/blog\/([^/]+)\/([^/]+)$/)
  if (!match) {
    return null
  }

  const lang = decodeURIComponent(match[1])
  const slug = decodeURIComponent(match[2])

  if (!isValidLocale(lang)) {
    return new Response(null, { status: 404 })
  }

  const rawPost = getBlogPostRawMarkdown(slug, lang)
  if (!rawPost) {
    return new Response(null, { status: 404 })
  }

  return new Response(request.method === 'HEAD' ? null : rawPost.markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': BLOG_CACHE_CONTROL,
      'X-Robots-Tag': 'noindex',
    },
  })
}

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext
) {
  const markdownResponse = getBlogMarkdownResponse(request)
  if (markdownResponse) {
    return markdownResponse
  }

  if (request.method.toUpperCase() === 'HEAD') {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    })
  }

  return new Promise((resolve, reject) => {
    let shellRendered = false
    const userAgent = request.headers.get('user-agent')

    const readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode ? 'onAllReady' : 'onShellReady'

    let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => abort(),
      streamTimeout + 1000
    )

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        [readyOption]() {
          shellRendered = true
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId)
              timeoutId = undefined
              callback()
            },
          })
          const stream = createReadableStreamFromReadable(body)

          responseHeaders.set('Content-Type', 'text/html')

          pipe(body)

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          )
        },
        onShellError(error: unknown) {
          reject(error)
        },
        onError(error: unknown) {
          responseStatusCode = 500
          if (shellRendered) {
            console.error(error)
          }
        },
      }
    )
  })
}
