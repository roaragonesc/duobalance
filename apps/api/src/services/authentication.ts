import { argon2id, hash, verify } from 'argon2'
import { User } from '../models/User.js'
import { Session } from '../models/Session.js'
import { findCredentials, publicProfile } from '../repositories/users.js'
import { ApiError } from '../utils/ApiError.js'
import { createToken, hashToken } from '../utils/tokens.js'
import type { Mailer } from './mail.js'

const hour = 60 * 60 * 1000
const passwordOptions = { type: argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 }
/** Unifica el rechazo de acceso sin revelar si la cuenta existe o está confirmada. */
const invalidCredentials = () => new ApiError(401, 'invalid_credentials', 'El correo electrónico o la contraseña no son correctos.')
/** Unifica tokens inválidos, caducados o ya consumidos sin revelar detalles internos. */
const invalidToken = () => new ApiError(400, 'invalid_token', 'El enlace no es válido o ha caducado.')

/** Registra una cuenta sin sobrescribir existentes, almacena Argon2id y solicita confirmación por correo. */
export async function register(input: { name: string; email: string; password: string }, mailer: Mailer) {
  const confirmationToken = createToken()
  const passwordHash = await hash(input.password, passwordOptions)
  // Upsert never changes an existing account or reveals whether it exists.
  try {
    const result = await User.updateOne({ email: input.email }, { $setOnInsert: {
      name: input.name,
      email: input.email,
      passwordHash,
      confirmed: false,
      authVersion: 0,
      confirmationHash: hashToken(confirmationToken),
      confirmationExpiresAt: new Date(Date.now() + 24 * hour),
    } }, { upsert: true })
    if (result.upsertedCount) {
      await mailer({
        to: input.email,
        subject: 'Confirma tu cuenta de DuoBalance',
        text: `Confirma tu cuenta enviando este token a POST /api/v1/auth/confirm-email: ${confirmationToken}`,
      })
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 11000) return
    throw error
  }
}

/** Renueva el token de confirmación de una cuenta pendiente sin revelar si el correo existe. */
export async function resendConfirmation(email: string, mailer: Mailer) {
  const value = createToken()
  const user = await User.findOneAndUpdate({ email, confirmed: false }, { $set: {
    confirmationHash: hashToken(value),
    confirmationExpiresAt: new Date(Date.now() + 24 * hour),
  } })
  if (user) {
    await mailer({ to: email, subject: 'Confirma tu cuenta de DuoBalance',
      text: `Confirma tu cuenta enviando este token a POST /api/v1/auth/confirm-email: ${value}` })
  }
}

/** Activa la cuenta mediante un token vigente de un uso y elimina sus datos de confirmación. */
export async function confirmEmail(value: string) {
  const result = await User.updateOne({
    confirmed: false,
    confirmationHash: hashToken(value),
    confirmationExpiresAt: { $gt: new Date() },
  }, {
    $set: { confirmed: true },
    $unset: { confirmationHash: '', confirmationExpiresAt: '' },
  })
  if (result.modifiedCount !== 1) throw invalidToken()
}

/** Verifica una cuenta confirmada y crea una sesión de siete días con cookie y protección CSRF. */
export async function login(email: string, password: string, dummyHash: string) {
  const user = await findCredentials(email)
  const valid = await verify(user?.passwordHash ?? dummyHash, password)
  if (!user || !valid || !user.confirmed) throw invalidCredentials()
  const sessionToken = createToken()
  const csrfToken = createToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * hour)
  await Session.create({
    tokenHash: hashToken(sessionToken),
    csrfHash: hashToken(csrfToken),
    userId: user._id,
    authVersion: user.authVersion,
    expiresAt,
  })
  return { sessionToken, csrfToken, expiresAt, user: publicProfile(user) }
}

/** Emite recuperación de una hora para cuentas confirmadas sin revelar si el correo está registrado. */
export async function forgotPassword(email: string, mailer: Mailer) {
  const value = createToken()
  const user = await User.findOneAndUpdate({ email, confirmed: true }, { $set: {
    resetHash: hashToken(value),
    resetExpiresAt: new Date(Date.now() + hour),
  } })
  if (user) {
    await mailer({ to: email, subject: 'Recupera tu contraseña de DuoBalance',
      text: `Restablece la contraseña enviando este token a POST /api/v1/auth/reset-password: ${value}` })
  }
}

/** Consume un token vigente, actualiza Argon2id e invalida todas las sesiones por versión de autenticación. */
export async function resetPassword(value: string, password: string) {
  const passwordHash = await hash(password, passwordOptions)
  const result = await User.updateOne({
    resetHash: hashToken(value), resetExpiresAt: { $gt: new Date() },
  }, {
    $set: { passwordHash },
    $inc: { authVersion: 1 },
    $unset: { resetHash: '', resetExpiresAt: '' },
  })
  if (result.modifiedCount !== 1) throw invalidToken()
}

/** Prepara un hash señuelo para verificar contraseñas incluso cuando no existe la cuenta. */
export function createDummyHash() {
  return hash(createToken(), passwordOptions)
}
