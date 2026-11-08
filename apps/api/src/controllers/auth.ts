import type { RequestHandler } from 'express'
import type { Environment } from '../config/environment.js'
import { Session } from '../models/Session.js'
import { currentSession, sessionCookie } from '../middlewares/session.js'
import * as auth from '../services/authentication.js'
import type { Mailer } from '../services/mail.js'
import * as schemas from '../validators/auth.js'
import { createToken, hashToken } from '../utils/tokens.js'

/** Construye los handlers de autenticación con correo y opciones de cookie del entorno validado. */
export function authControllers(env: Environment, mailer: Mailer, dummyHash: string) {
  const cookieOptions = {
    httpOnly: true, secure: new URL(env.FRONTEND_ORIGIN).protocol === 'https:',
    sameSite: 'lax' as const, path: '/api/v1',
  }
  /** POST /auth/register: valida el alta y responde 202 sin revelar si la cuenta existe. */
  const register: RequestHandler = async (request, response) => {
    await auth.register(schemas.registration.parse(request.body), mailer)
    response.status(202).json({ message: 'Si corresponde, recibirás un correo de confirmación.' })
  }
  /** POST /auth/resend-confirmation: renueva el correo de confirmación con respuesta no enumerativa. */
  const resend: RequestHandler = async (request, response) => {
    await auth.resendConfirmation(schemas.emailRequest.parse(request.body).email, mailer)
    response.status(202).json({ message: 'Si corresponde, recibirás un correo de confirmación.' })
  }
  /** POST /auth/confirm-email: consume el token de confirmación y responde 204 sin iniciar sesión. */
  const confirm: RequestHandler = async (request, response) => {
    await auth.confirmEmail(schemas.confirmation.parse(request.body).token)
    response.sendStatus(204)
  }
  /** POST /auth/login: autentica, establece la cookie HttpOnly y devuelve perfil y token CSRF. */
  const login: RequestHandler = async (request, response) => {
    const input = schemas.credentials.parse(request.body)
    const result = await auth.login(input.email, input.password, dummyHash)
    response.cookie(sessionCookie, result.sessionToken, { ...cookieOptions, expires: result.expiresAt })
    response.json({ user: result.user, csrfToken: result.csrfToken })
  }
  /** POST /auth/logout: revoca la sesión autenticada y elimina su cookie. */
  const logout: RequestHandler = async (request, response) => {
    await Session.deleteOne({ _id: currentSession(request).sessionId })
    response.clearCookie(sessionCookie, cookieOptions).sendStatus(204)
  }
  /** GET /auth/csrf: rota la protección CSRF de la sesión para restaurar el cliente tras una recarga. */
  const csrf: RequestHandler = async (request, response) => {
    const value = createToken()
    await Session.updateOne({ _id: currentSession(request).sessionId }, { $set: { csrfHash: hashToken(value) } })
    response.json({ csrfToken: value })
  }
  /** POST /auth/forgot-password: solicita recuperación sin revelar si el correo está registrado. */
  const forgot: RequestHandler = async (request, response) => {
    await auth.forgotPassword(schemas.emailRequest.parse(request.body).email, mailer)
    response.status(202).json({ message: 'Si existe una cuenta con ese correo, recibirás un enlace de recuperación.' })
  }
  /** POST /auth/reset-password: valida token/contraseña, invalida sesiones y elimina la cookie del navegador. */
  const reset: RequestHandler = async (request, response) => {
    const input = schemas.resetPassword.parse(request.body)
    await auth.resetPassword(input.token, input.password)
    response.clearCookie(sessionCookie, cookieOptions).sendStatus(204)
  }
  return { register, resend, confirm, login, logout, csrf, forgot, reset }
}
