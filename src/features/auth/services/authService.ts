import { isAuthError } from '@supabase/supabase-js'
import { getSupabaseClient } from '../../../lib/supabase/client'
import { AUTH_CALLBACK_PATH } from '../navigation'
import type { LoginCredentials, RegistrationData } from '../types/auth'

export type SignUpResult = {
  needsEmailConfirmation: boolean
}

// Codes that would reveal that an email is already registered.
const EXISTING_ACCOUNT_CODES = new Set(['user_already_exists', 'email_exists'])

// The current origin keeps the PKCE verifier (stored per origin) reachable on return.
function getRedirectUrl(path: string) {
  return new URL(path, window.location.origin).toString()
}

export function getEmailConfirmationUrl(next?: string): string {
  const url = new URL(AUTH_CALLBACK_PATH, window.location.origin)
  if (next) url.searchParams.set('next', next)
  return url.toString()
}

export type EmailConfirmationType = 'signup' | 'email'

export async function signIn({
  email,
  password,
}: LoginCredentials): Promise<void> {
  const { error } = await getSupabaseClient().auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
}

export async function signUp({
  name,
  email,
  password,
  redirectPath,
}: RegistrationData & { redirectPath?: string }): Promise<SignUpResult> {
  const { data, error } = await getSupabaseClient().auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name },
      emailRedirectTo: getEmailConfirmationUrl(redirectPath),
    },
  })

  if (error) {
    if (isAuthError(error) && EXISTING_ACCOUNT_CODES.has(error.code ?? '')) {
      return { needsEmailConfirmation: true }
    }
    throw error
  }

  return { needsEmailConfirmation: data.session === null }
}

// Supabase enforces the email send rate limit (over_email_send_rate_limit).
export async function resendConfirmation(
  email: string,
  redirectPath?: string,
): Promise<void> {
  const { error } = await getSupabaseClient().auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: getEmailConfirmationUrl(redirectPath) },
  })
  if (error) throw error
}

// For email templates that link with token_hash instead of the PKCE code.
export async function confirmEmail(
  tokenHash: string,
  type: EmailConfirmationType,
): Promise<void> {
  const { error } = await getSupabaseClient().auth.verifyOtp({
    token_hash: tokenHash,
    type,
  })
  if (error) throw error
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await getSupabaseClient().auth.resetPasswordForEmail(
    email,
    { redirectTo: getRedirectUrl('/reset-password') },
  )
  if (error) throw error
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await getSupabaseClient().auth.updateUser({ password })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut()
  if (error) throw error
}
