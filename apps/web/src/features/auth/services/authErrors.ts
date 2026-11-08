import { HttpError } from '../../../services/api/http'

const NETWORK_MESSAGE =
  'No se ha podido conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.'

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpError) return error.message
  if (error instanceof TypeError) return NETWORK_MESSAGE
  return fallback
}

export type AuthLinkError = 'expired' | 'invalid'

export function toAuthLinkError(error: unknown): AuthLinkError {
  return error instanceof HttpError && error.code === 'token_expired' ? 'expired' : 'invalid'
}

export function getAuthLinkError(search: string, hash: string): AuthLinkError | null {
  const query = new URLSearchParams(search)
  const fragment = new URLSearchParams(hash.replace(/^#/, ''))
  const read = (key: string) => query.get(key) ?? fragment.get(key)
  if (read('error') === null && read('error_code') === null) return null
  return read('error_code') === 'token_expired' ? 'expired' : 'invalid'
}

export function hasAuthLinkError(search: string, hash: string): boolean {
  return getAuthLinkError(search, hash) !== null
}
