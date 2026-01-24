import crypto from 'node:crypto'

export function hashUserId(userId: string): string {
  const hash = crypto.createHash('sha256').update(userId).digest('hex')
  return hash.substring(0, 16)
}
