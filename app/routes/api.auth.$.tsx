import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router'
import { auth } from '~/lib/auth'

function withNoCache(response: Response): Response {
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function loader({ request }: LoaderFunctionArgs) {
  return withNoCache(await auth.handler(request))
}

export async function action({ request }: ActionFunctionArgs) {
  return withNoCache(await auth.handler(request))
}
