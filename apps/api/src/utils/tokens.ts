import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export function createToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function matchesHash(token: string, hash: string): boolean {
  return timingSafeEqual(Buffer.from(hashToken(token), 'hex'), Buffer.from(hash, 'hex'))
}
