import { AuthApiError } from '@supabase/supabase-js'
import type { LoginCredentials, RegistrationData } from '../src/features/auth/types/auth'
import type { SignUpResult } from '../src/features/auth/services/authService'
import { DEMO_PASSWORD, demoDelay, demoUsers, updateDemoState } from './demoStore'

export { getEmailConfirmationUrl } from '../src/features/auth/services/authService'
export type { EmailConfirmationType, SignUpResult } from '../src/features/auth/services/authService'

export async function signIn({ email, password }: LoginCredentials): Promise<void> {
  await demoDelay()
  const user = demoUsers.find((candidate) => candidate.email === email.trim().toLowerCase())
  if (!user || password !== DEMO_PASSWORD) {
    throw new AuthApiError('Invalid login credentials', 400, 'invalid_credentials')
  }
  updateDemoState((state) => ({ ...state, user: user.key }))
}

// Registration always asks for email confirmation, as in Supabase.
export async function signUp(
  _data: RegistrationData & { redirectPath?: string },
): Promise<SignUpResult> {
  await demoDelay()
  return { needsEmailConfirmation: true }
}

export async function resendConfirmation(_email: string, _redirectPath?: string): Promise<void> {
  await demoDelay()
}

export async function confirmEmail(): Promise<void> {
  await demoDelay()
  throw new AuthApiError('Email link is invalid or has expired', 403, 'otp_expired')
}

export async function requestPasswordReset(_email: string): Promise<void> {
  await demoDelay()
}

export async function updatePassword(_password: string): Promise<void> {
  await demoDelay()
}

export async function signOut(): Promise<void> {
  updateDemoState((state) => ({ ...state, user: null }))
}
