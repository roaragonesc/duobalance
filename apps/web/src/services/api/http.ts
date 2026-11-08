import { isApiErrorResponse } from '@duobalance/shared-schemas'
import { csrfResponse } from './contracts'

let csrfToken: string | null = null
let csrfRequest: Promise<string> | null = null
let sessionRevision = 0

export const sessionExpired = 'duobalance-api-session-expired'

export interface ResponseDecoder<T> {
  safeParse(value: unknown): { success: true; data: T } | { success: false }
}

/** Error HTTP público que conserva código de negocio y estado para los servicios de features. */
export class HttpError extends Error {
  readonly code: string
  readonly status: number
  /** Inicializa el error a partir del contrato público validado, no de un cuerpo arbitrario. */
  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
  }
}

/** Señala una respuesta no JSON o incompatible con el contrato sin incluir sus valores. */
export class ApiResponseError extends Error {
  /** Expone solo el estado HTTP del fallo de formato. */
  constructor(status: number) {
    super(`El servidor devolvió una respuesta no válida (${status}).`)
    this.name = 'ApiResponseError'
  }
}

/** Cambia la protección de la sesión e invalida adquisiciones pendientes de una sesión anterior. */
export function setCsrfToken(value: string | null): void {
  sessionRevision++
  csrfToken = value
  csrfRequest = null
}

/** Comprueba JSON, errores públicos y campos consumidos mediante el decoder runtime de la llamada. */
async function readResponse<T>(response: Response, decoder: ResponseDecoder<T>): Promise<T> {
  let result: unknown
  if (response.status !== 204) {
    if (!response.headers.get('Content-Type')?.toLowerCase().includes('application/json')) {
      throw new ApiResponseError(response.status)
    }
    try {
      result = await response.json()
    } catch (error) {
      if (error instanceof SyntaxError) throw new ApiResponseError(response.status)
      throw error
    }
  }
  if (!response.ok) {
    if (!isApiErrorResponse(result)) throw new ApiResponseError(response.status)
    throw new HttpError(response.status, result.error.code, result.error.message)
  }
  const parsed = decoder.safeParse(result)
  if (!parsed.success) throw new ApiResponseError(response.status)
  return parsed.data
}

/** Comparte una adquisición CSRF entre llamadas concurrentes sin reutilizar fallos ni sesiones anteriores. */
async function acquireCsrf(): Promise<string> {
  if (csrfToken) return csrfToken
  if (csrfRequest) return csrfRequest
  const revision = sessionRevision
  const request = http('/auth/csrf', csrfResponse).then(({ csrfToken: token }) => {
    if (revision !== sessionRevision) throw new Error('La sesión ha cambiado. Vuelve a intentar la operación.')
    csrfToken = token
    return token
  })
  csrfRequest = request
  try {
    return await request
  } finally {
    if (csrfRequest === request) csrfRequest = null
  }
}

/** Envía peticiones con cookies y contratos; reintenta solo una vez un rechazo CSRF previo a la mutación. */
export async function http<T>(
  path: string, decoder: ResponseDecoder<T>, method = 'GET', body?: object,
): Promise<T> {
  const revision = sessionRevision
  let sentToken: string | null = null
  const needsCsrf = !['GET', 'HEAD', 'OPTIONS'].includes(method) &&
    (!path.startsWith('/auth/') || path === '/auth/logout')
  /** Envía un intento con el token actual, comprobando que la sesión no cambió durante su adquisición. */
  async function send(): Promise<T> {
    const token = needsCsrf ? await acquireCsrf() : csrfToken
    if (needsCsrf && revision !== sessionRevision) {
      throw new Error('La sesión ha cambiado. Vuelve a intentar la operación.')
    }
    sentToken = token
    const response = await fetch(`/api/v1${path}`, {
      method, credentials: 'include',
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { 'X-CSRF-Token': token } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    return readResponse(response, decoder)
  }
  try {
    try {
      return await send()
    } catch (error) {
      // CSRF middleware rejects before a mutation executes: retry only that rejection.
      if (!(error instanceof HttpError) || error.code !== 'invalid_csrf' || error.status !== 403 ||
          !needsCsrf || revision !== sessionRevision) throw error
      if (csrfToken === sentToken) csrfToken = null
      return await send()
    }
  } catch (error) {
    if (error instanceof HttpError && error.status === 401 && path !== '/auth/login' && revision === sessionRevision) {
      setCsrfToken(null)
      window.dispatchEvent(new Event(sessionExpired))
    }
    throw error
  }
}
