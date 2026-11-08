import { isApiErrorResponse } from '@duobalance/shared-schemas'

let csrfToken: string | null = null

export class HttpError extends Error {
  readonly code: string
  readonly status: number
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function setCsrfToken(value: string | null) { csrfToken = value }

export async function http<T>(path: string, method = 'GET', body?: object): Promise<T> {
  if (method !== 'GET' && !path.startsWith('/auth/') && !csrfToken) {
    csrfToken = (await http<{ csrfToken: string }>('/auth/csrf')).csrfToken
  }
  const response = await fetch(`/api/v1${path}`, {
    method, credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!response.ok) {
    const result: unknown = await response.json()
    if (isApiErrorResponse(result)) {
      throw new HttpError(response.status, result.error.code, result.error.message)
    }
    throw new Error(`El servidor devolvió una respuesta no válida (${response.status}).`)
  }
  if (response.status === 204) return undefined as T
  return response.json()
}
