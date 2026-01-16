import { checkDbConnection } from '~/db'

export async function loader() {
  try {
    await checkDbConnection()
    return new Response('ok', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(`error: ${message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}
