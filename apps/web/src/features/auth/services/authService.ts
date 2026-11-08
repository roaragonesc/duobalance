import type { LoginCredentials, RegistrationData } from '../types/auth'
import { http, setCsrfToken } from '../../../services/api/http'
import { AUTH_CALLBACK_PATH } from '../navigation'

export type SignUpResult = { needsEmailConfirmation: boolean }
export type EmailConfirmationType = 'signup' | 'email'
export const authChanged = 'duobalance-api-auth-changed'
export type ApiUser = { id: string; name: string; email: string; createdAt: string; confirmed: boolean }

export async function signIn(input: LoginCredentials): Promise<void> {
  const result = await http<{ csrfToken: string }>('/auth/login', 'POST', input)
  setCsrfToken(result.csrfToken)
  window.dispatchEvent(new Event(authChanged))
}

export async function signUp({ name, email, password }: RegistrationData & { redirectPath?: string }): Promise<SignUpResult> {
  await http('/auth/register', 'POST', { name, email, password })
  return { needsEmailConfirmation: true }
}

export async function resendConfirmation(email: string, _redirectPath?: string): Promise<void> {
  await http('/auth/resend-confirmation', 'POST', { email })
}

export async function confirmEmail(token: string, _type: EmailConfirmationType): Promise<void> {
  await http('/auth/confirm-email', 'POST', { token })
  window.location.assign('/login')
}

export async function requestPasswordReset(email: string): Promise<void> {
  await http('/auth/forgot-password', 'POST', { email })
}

export async function updatePassword(password: string): Promise<void> {
  const token = new URLSearchParams(window.location.search).get('token')
  if (!token) throw new Error('Falta el token de recuperación.')
  await http('/auth/reset-password', 'POST', { token, password })
  setCsrfToken(null)
}

export async function signOut(): Promise<void> {
  // Password recovery has already invalidated the session.
  if (!new URLSearchParams(window.location.search).has('token')) {
    const { csrfToken } = await http<{ csrfToken: string }>('/auth/csrf')
    setCsrfToken(csrfToken)
    await http('/auth/logout', 'POST', {})
  }
  setCsrfToken(null)
  window.dispatchEvent(new Event(authChanged))
}

export function getEmailConfirmationUrl(next?: string): string {
  const url = new URL(AUTH_CALLBACK_PATH, window.location.origin)
  if (next) url.searchParams.set('next', next)
  return url.toString()
}
