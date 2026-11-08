import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/** Genera un token aleatorio de 256 bits para sesiones, invitaciones y enlaces de un uso. */
export function createToken(): string {
  return randomBytes(32).toString('hex')
}

/** Calcula SHA-256 para almacenar y consultar tokens sin persistir su valor original. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Compara el hash del token recibido en tiempo constante con el hash almacenado. */
export function matchesHash(token: string, hash: string): boolean {
  return timingSafeEqual(Buffer.from(hashToken(token), 'hex'), Buffer.from(hash, 'hex'))
}
