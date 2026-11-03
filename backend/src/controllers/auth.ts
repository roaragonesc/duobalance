import type { RequestHandler } from 'express'
import type { Environment } from '../config/environment.js'
import { Session } from '../models/Session.js'
import { currentSession, sessionCookie } from '../middlewares/session.js'
import * as auth from '../services/authentication.js'
import type { Mailer } from '../services/mail.js'
import * as schemas from '../validators/auth.js'
import { createToken, hashToken } from '../utils/tokens.js'

export function authControllers(env: Environment, mailer: Mailer, dummyHash: string) {
  const cookieOptions = {
    httpOnly: true, secure: new URL(env.FRONTEND_ORIGIN).protocol === 'https:',
    sameSite: 'lax' as const, path: '/api/v1',
  }
  const register: RequestHandler = async (request, response) => {
    await auth.register(schemas.registration.parse(request.body), mailer)
    response.status(202).json({ message: 'Si corresponde, recibirás un correo de confirmación.' })
  }
  const resend: RequestHandler = async (request, response) => {
    await auth.resendConfirmation(schemas.emailRequest.parse(request.body).email, mailer)
    response.status(202).json({ message: 'Si corresponde, recibirás un correo de confirmación.' })
  }
  const confirm: RequestHandler = async (request, response) => {
    await auth.confirmEmail(schemas.confirmation.parse(request.body).token)
    response.sendStatus(204)
  }
  const login: RequestHandler = async (request, response) => {
    const input = schemas.credentials.parse(request.body)
    const result = await auth.login(input.email, input.password, dummyHash)
    response.cookie(sessionCookie, result.sessionToken, { ...cookieOptions, expires: result.expiresAt })
    response.json({ user: result.user, csrfToken: result.csrfToken })
  }
  const logout: RequestHandler = async (request, response) => {
    await Session.deleteOne({ _id: currentSession(request).sessionId })
    response.clearCookie(sessionCookie, cookieOptions).sendStatus(204)
  }
  const csrf: RequestHandler = async (request, response) => {
    const value = createToken()
    await Session.updateOne({ _id: currentSession(request).sessionId }, { $set: { csrfHash: hashToken(value) } })
    response.json({ csrfToken: value })
  }
  const forgot: RequestHandler = async (request, response) => {
    await auth.forgotPassword(schemas.emailRequest.parse(request.body).email, mailer)
    response.status(202).json({ message: 'Si existe una cuenta con ese correo, recibirás un enlace de recuperación.' })
  }
  const reset: RequestHandler = async (request, response) => {
    const input = schemas.resetPassword.parse(request.body)
    await auth.resetPassword(input.token, input.password)
    response.clearCookie(sessionCookie, cookieOptions).sendStatus(204)
  }
  return { register, resend, confirm, login, logout, csrf, forgot, reset }
}
