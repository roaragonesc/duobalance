import type { Request, RequestHandler } from 'express'
import { parse } from 'cookie'
import { Session } from '../models/Session.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { hashToken, matchesHash } from '../utils/tokens.js'

export const sessionCookie = 'duobalance-session'

type AuthenticatedUser = {
  userId: string
  sessionId: string
  csrfHash: string
}
const authenticated = new WeakMap<Request, AuthenticatedUser>()

export const requireSession: RequestHandler = async (request, _response, next) => {
  const value = parse(request.headers.cookie ?? '')[sessionCookie]
  if (!value || !/^[a-f0-9]{64}$/.test(value)) {
    throw new ApiError(401, 'not_authenticated', 'Debes iniciar sesión.')
  }
  const session = await Session.findOne({ tokenHash: hashToken(value), expiresAt: { $gt: new Date() } })
  if (!session) throw new ApiError(401, 'not_authenticated', 'Debes iniciar sesión.')
  const user = await User.findOne({ _id: session.userId, authVersion: session.authVersion, confirmed: true })
  if (!user) throw new ApiError(401, 'not_authenticated', 'Debes iniciar sesión.')
  authenticated.set(request, {
    userId: user._id.toHexString(), sessionId: session._id.toHexString(), csrfHash: session.csrfHash,
  })
  next()
}

export function currentSession(request: Request): AuthenticatedUser {
  const session = authenticated.get(request)
  if (!session) throw new Error('La ruta necesita requireSession.')
  return session
}

export const requireCsrf: RequestHandler = (request, _response, next) => {
  const value = request.get('X-CSRF-Token')
  if (!value || value.length > 128 || !matchesHash(value, currentSession(request).csrfHash)) {
    throw new ApiError(403, 'invalid_csrf', 'La protección CSRF no es válida.')
  }
  next()
}
