import { AuthApiError } from '@supabase/supabase-js'
import type { LoginCredentials, RegistrationData } from '../src/features/auth/types/auth'
import type { SignUpResult } from '../src/features/auth/services/authService'
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
  const url = new URL('/auth/callback', window.location.origin)
  if (token) {
    url.searchParams.set('token_hash', token)
    url.searchParams.set('type', 'signup')
  }
  const redirect = next ?? account?.confirmationNext
  if (redirect) url.searchParams.set('next', redirect)
  return url.toString()
}

export async function signIn({ email, password }: LoginCredentials): Promise<void> {
  await demoDelay()
  const account = findDemoUserByEmail(email)
  if (!account || account.password !== password) {
    throw new AuthApiError('Invalid login credentials', 400, 'invalid_credentials')
  }
  if (!account.confirmed) {
    throw new AuthApiError('Email not confirmed', 400, 'email_not_confirmed')
  }
  updateDemoState((state) => ({ ...state, user: account.key }))
}

export async function signUp(
  { name, email, password, redirectPath }: RegistrationData & { redirectPath?: string },
): Promise<SignUpResult> {
  await demoDelay()
  const normalizedEmail = email.trim().toLowerCase()
  if (findDemoUserByEmail(normalizedEmail)) {
    throw new AuthApiError('User already registered', 400, 'user_already_exists')
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
  addDemoUser(account)
  return { needsEmailConfirmation: true }
}

export async function resendConfirmation(email: string, redirectPath?: string): Promise<void> {
  await demoDelay()
  const account = findDemoUserByEmail(email)
  if (!account || account.confirmed) return
  updateDemoState((state) => ({
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
  if (type !== 'signup') throw new AuthApiError('Invalid email link', 400, 'otp_expired')
  const account = Object.values(getDemoState().users).find(
    (candidate) => candidate.confirmationToken === tokenHash,
  )
  if (!account) throw new AuthApiError('Email link expired', 400, 'otp_expired')
  updateDemoState((state) => ({
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
  updateDemoState((state) => ({
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
  if (!account) throw new AuthApiError('Recovery link expired', 400, 'otp_expired')
  updateDemoState((state) => ({ ...state, user: account.key }))
  const url = new URL('/reset-password', window.location.origin)
  url.searchParams.set('mock_token', token)
  return url.toString()
}

export async function updatePassword(password: string): Promise<void> {
  await demoDelay()
  const { user, users } = getDemoState()
  const account = user ? users[user] : null
  if (!account || !account.passwordResetToken) {
    throw new AuthApiError('Recovery session not found', 401, 'session_not_found')
  }
  if (account.password === password) {
    throw new AuthApiError('New password should be different', 400, 'same_password')
  }
  updateDemoState((state) => ({
    ...state,
    users: {
      ...state.users,
      [account.key]: { ...account, password, passwordResetToken: null },
    },
  }))
}

export async function signOut(): Promise<void> {
  await demoDelay()
  updateDemoState((state) => ({ ...state, user: null }))
}

export { DEMO_PASSWORD }
