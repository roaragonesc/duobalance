import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { ApiError } from '../utils/ApiError.js'

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({ error: {
      code: 'invalid_input',
      message: 'Revisa los campos enviados.',
      fields: error.issues.map((issue) => issue.path.join('.')),
    } })
    return
  }
  if (error instanceof ApiError) {
    response.status(error.status).json({ error: { code: error.code, message: error.message } })
    return
  }
  if (error instanceof Error && 'code' in error && error.code === 11000) {
    response.status(409).json({ error: { code: 'conflict', message: 'El recurso ya existe o el usuario ya pertenece a un espacio.' } })
    return
  }
  if (error instanceof Error && 'status' in error && (error.status === 400 || error.status === 413)) {
    response.status(error.status).json({ error: { code: 'invalid_body', message: 'El cuerpo JSON no es válido o es demasiado grande.' } })
    return
  }
  // Do not log request bodies, connection strings, password hashes or mail tokens.
  console.error('Error interno del backend.', error instanceof Error ? error.name : 'UnknownError')
  response.status(500).json({ error: { code: 'internal_error', message: 'No se ha podido completar la operación.' } })
}
