import { HttpError } from '../src/services/api/http'
import type { LoginCredentials, RegistrationData } from '../src/features/auth/types/auth'
import type { SignUpResult } from '../src/features/auth/services/authService'
import { demoUrl } from './navigation'
import {
  addDemoUser,
  createDemoToken,
  createDemoUserKey,
  DEMO_PASSWORD,
  demoDelay,
  findDemoUserByEmail,
  getDemoState,
  updateDemoState,
} from './demoStore'

export type { EmailConfirmationType, SignUpResult } from '../src/features/auth/services/authService'

export function getEmailConfirmationUrl(next?: string): string {
  const account = Object.values(getDemoState().users)
    .filter((user) => !user.confirmed && user.confirmationToken)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  const token = account?.confirmationToken
  const redirect = next ?? account?.confirmationNext
  return demoUrl('/auth/callback', {
    ...(token ? { token_hash: token, type: 'signup' } : {}),
    ...(redirect ? { next: redirect } : {}),
  })
}

export async function signIn({ email, password }: LoginCredentials): Promise<void> {
  await demoDelay()
  const account = findDemoUserByEmail(email)
  if (!account || account.password !== password) {
    throw new HttpError(401, 'invalid_credentials', 'El correo electrónico o la contraseña no son correctos.')
  }
  if (!account.confirmed) {
    throw new HttpError(403, 'email_not_confirmed', 'Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.')
  }
  await updateDemoState((state) => ({ ...state, user: account.key }))
}

export async function signUp(
  { name, email, password, redirectPath }: RegistrationData & { redirectPath?: string },
): Promise<SignUpResult> {
  await demoDelay()
  const normalizedEmail = email.trim().toLowerCase()
  if (findDemoUserByEmail(normalizedEmail)) {
    throw new HttpError(409, 'user_already_exists', 'Ya existe una cuenta con este correo electrónico.')
  }
  const account = {
    key: createDemoUserKey(),
    email: normalizedEmail,
    name: name.trim(),
    description: 'Cuenta mock registrada',
    password,
    confirmed: false,
    confirmationToken: createDemoToken(),
    confirmationNext: redirectPath ?? null,
    passwordResetToken: null,
    createdAt: new Date().toISOString(),
  }
  await addDemoUser(account)
  return { needsEmailConfirmation: true }
}

export async function resendConfirmation(email: string, redirectPath?: string): Promise<void> {
  await demoDelay()
  const account = findDemoUserByEmail(email)
  if (!account || account.confirmed) return
  await updateDemoState((state) => ({
    ...state,
    users: {
      ...state.users,
      [account.key]: {
        ...account,
        confirmationToken: createDemoToken(),
        confirmationNext: redirectPath ?? account.confirmationNext,
      },
    },
  }))
}

export async function confirmEmail(
  tokenHash: string,
  type: 'signup' | 'email',
): Promise<void> {
  await demoDelay()
  if (type !== 'signup') throw new HttpError(400, 'token_expired', 'El enlace no es válido o ha caducado.')
  const account = Object.values(getDemoState().users).find(
    (candidate) => candidate.confirmationToken === tokenHash,
  )
  if (!account) throw new HttpError(400, 'token_expired', 'El enlace no es válido o ha caducado.')
  await updateDemoState((state) => ({
    ...state,
    user: account.key,
    users: {
      ...state.users,
      [account.key]: {
        ...account,
        confirmed: true,
        confirmationToken: null,
        confirmationNext: null,
      },
    },
  }))
}

export async function requestPasswordReset(email: string): Promise<void> {
  await demoDelay()
  const account = findDemoUserByEmail(email)
  if (!account || !account.confirmed) return
  await updateDemoState((state) => ({
    ...state,
    users: {
      ...state.users,
      [account.key]: { ...account, passwordResetToken: createDemoToken() },
    },
  }))
}

/** Opens a local-only recovery link from the mock controls panel. */
export function beginPasswordReset(token: string): string {
  const account = Object.values(getDemoState().users).find(
    (candidate) => candidate.passwordResetToken === token,
  )
  if (!account) throw new HttpError(400, 'token_expired', 'El enlace de recuperación no es válido o ha caducado.')
  updateDemoState((state) => ({ ...state, user: account.key }))
  return demoUrl('/reset-password', { mock_token: token })
}

export async function updatePassword(password: string): Promise<void> {
  await demoDelay()
  const { user, users } = getDemoState()
  const account = user ? users[user] : null
  if (!account || !account.passwordResetToken) {
    throw new HttpError(401, 'session_not_found', 'Tu sesión ha caducado. Vuelve a intentarlo.')
  }
  if (account.password === password) {
    throw new HttpError(400, 'same_password', 'La nueva contraseña debe ser distinta de la actual.')
  }
  await updateDemoState((state) => ({
    ...state,
    users: {
      ...state.users,
      [account.key]: { ...account, password, passwordResetToken: null },
    },
  }))
}

export async function signOut(): Promise<void> {
  await demoDelay()
  await updateDemoState((state) => ({ ...state, user: null }))
}

export { DEMO_PASSWORD }
