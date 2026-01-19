import { redirect, type LoaderFunctionArgs } from 'react-router'
import { trackClickAndGetUrl } from '~/services/links.server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function loader({ params }: LoaderFunctionArgs) {
  const { linkId } = params

  if (!linkId || !UUID_REGEX.test(linkId)) {
    throw new Response('Not Found', { status: 404 })
  }

  const result = await trackClickAndGetUrl(linkId)

  if (!result.success) {
    throw new Response('Not Found', { status: 404 })
  }

  return redirect(result.url, { status: 302 })
}
