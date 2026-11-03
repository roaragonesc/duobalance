import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'
import { rateLimit } from 'express-rate-limit'
import type { Environment } from './config/environment.js'
import { apiRoutes } from './routes/api.js'
import { errorHandler } from './middlewares/errors.js'
import { ApiError } from './utils/ApiError.js'
import type { Mailer } from './services/mail.js'
import { openApi } from './config/openApi.js'

export function createApp(env: Environment, mailer: Mailer, dummyHash: string) {
  const app = express()
  app.disable('x-powered-by')
  app.use(helmet())
  app.use((_request, response, next) => {
    response.set('Cache-Control', 'no-store')
    next()
  })
  app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true,
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'], methods: ['GET', 'POST', 'PATCH', 'DELETE'] }))
  app.use(rateLimit({ windowMs: 60 * 1000, limit: env.NODE_ENV === 'test' ? 1000 : 120, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: { code: 'rate_limited', message: 'Demasiadas solicitudes.' } } }))
  app.use((request, _response, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      if (request.get('Origin') !== env.FRONTEND_ORIGIN) {
        throw new ApiError(403, 'invalid_origin', 'El origen de la solicitud no está permitido.')
      }
      if (request.method !== 'DELETE' && !request.is('application/json')) {
        throw new ApiError(415, 'unsupported_media_type', 'Debes enviar JSON.')
      }
    }
    next()
  })
  app.use(express.json({ limit: '16kb' }))
  app.get('/api/v1/health', (_request, response) => {
    const ready = mongoose.connection.readyState === 1
    response.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'unavailable' })
  })
  app.get('/api/v1/api-docs', (_request, response) => { response.json(openApi) })
  app.use('/api/v1', apiRoutes(env, mailer, dummyHash))
  app.use((_request, _response) => { throw new ApiError(404, 'not_found', 'No se ha encontrado el recurso.') })
  app.use(errorHandler)
  return app
}
