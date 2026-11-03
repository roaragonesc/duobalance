import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import type { Environment } from '../config/environment.js'
import { authControllers } from '../controllers/auth.js'
import * as users from '../controllers/users.js'
import { requireCsrf, requireSession } from '../middlewares/session.js'
import type { Mailer } from '../services/mail.js'
import { financeRoutes } from './finance.js'

export function apiRoutes(env: Environment, mailer: Mailer, dummyHash: string) {
  const router = Router()
  const auth = authControllers(env, mailer, dummyHash)
  const sensitive = rateLimit({
    windowMs: 15 * 60 * 1000, limit: env.NODE_ENV === 'test' ? 200 : 20, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: { code: 'rate_limited', message: 'Demasiados intentos. Inténtalo más tarde.' } },
  })
  const searchLimit = rateLimit({
    windowMs: 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: { code: 'rate_limited', message: 'Demasiadas búsquedas. Inténtalo más tarde.' } },
  })
  router.post('/auth/register', sensitive, auth.register)
  router.post('/auth/login', sensitive, auth.login)
  router.post('/auth/confirm-email', sensitive, auth.confirm)
  router.post('/auth/resend-confirmation', sensitive, auth.resend)
  router.post('/auth/forgot-password', sensitive, auth.forgot)
  router.post('/auth/reset-password', sensitive, auth.reset)
  router.get('/auth/me', requireSession, users.me)
  router.get('/auth/csrf', requireSession, auth.csrf)
  router.post('/auth/logout', requireSession, requireCsrf, auth.logout)
  router.get('/users/me', requireSession, users.me)
  router.patch('/users/me', requireSession, requireCsrf, users.updateMe)
  router.get('/users', requireSession, searchLimit, users.search)
  router.use(financeRoutes)
  return router
}
