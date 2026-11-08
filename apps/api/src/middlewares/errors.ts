import type { ErrorRequestHandler } from 'express'
import type { ApiErrorResponse } from '@duobalance/shared-types'
import { ZodError } from 'zod'
import { ApiError } from '../utils/ApiError.js'

/** Traduce validación, conflictos y fallos internos a errores HTTP coherentes sin datos sensibles. */
export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  /** Envuelve los errores públicos en la forma JSON compartida por API y navegador. */
  const sendError = (status: number, body: ApiErrorResponse['error']) => {
    response.status(status).json({ error: body })
  }

  if (error instanceof ZodError) {
    sendError(400, {
      code: 'invalid_input',
      message: 'Revisa los campos enviados.',
      fields: error.issues.map((issue) => issue.path.join('.')),
    })
    return
  }
  if (error instanceof ApiError) {
    sendError(error.status, { code: error.code, message: error.message })
    return
  }
  if (error instanceof Error && 'code' in error && error.code === 11000) {
    sendError(409, { code: 'conflict', message: 'El recurso ya existe o el usuario ya pertenece a un espacio.' })
    return
  }
  if (error instanceof Error && 'status' in error && (error.status === 400 || error.status === 413)) {
    sendError(error.status, { code: 'invalid_body', message: 'El cuerpo JSON no es válido o es demasiado grande.' })
    return
  }
  // Do not log request bodies, connection strings, password hashes or mail tokens.
  console.error('Error interno del backend.', error instanceof Error ? error.name : 'UnknownError')
  sendError(500, { code: 'internal_error', message: 'No se ha podido completar la operación.' })
}
