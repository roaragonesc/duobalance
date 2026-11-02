import { isAuthError } from '@supabase/supabase-js'
import { SupabaseNotConfiguredError } from '../../../lib/supabase/client'

const MESSAGES: Record<string, string> = {
  invalid_credentials:
    'El correo electrónico o la contraseña no son correctos.',
  email_not_confirmed:
    'Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.',
  weak_password: 'La contraseña no cumple los requisitos de seguridad.',
  same_password: 'La nueva contraseña debe ser distinta de la actual.',
  email_address_invalid: 'Introduce un correo electrónico válido.',
  email_address_not_authorized:
    'No se ha podido enviar el correo a esta dirección. Inténtalo más tarde.',
  over_email_send_rate_limit:
    'Se han enviado demasiados correos. Espera unos minutos e inténtalo de nuevo.',
  over_request_rate_limit:
    'Se han realizado demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  signup_disabled: 'El registro de nuevas cuentas no está disponible.',
  session_not_found: 'Tu sesión ha caducado. Vuelve a intentarlo.',
  session_expired: 'Tu sesión ha caducado. Vuelve a intentarlo.',
  reauthentication_needed:
    'Por seguridad, vuelve a iniciar sesión antes de cambiar la contraseña.',
}

const NETWORK_MESSAGE =
  'No se ha podido conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.'

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof SupabaseNotConfiguredError) {
    return 'El servicio de autenticación todavía no está configurado.'
  }
  if (isAuthError(error)) {
    if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]
    if (error.status === 0 || error.name === 'AuthRetryableFetchError') {
      return NETWORK_MESSAGE
    }
    return fallback
  }
  if (error instanceof TypeError) return NETWORK_MESSAGE
  return fallback
}

export type AuthLinkError = 'expired' | 'invalid' | 'otherBrowser'

// Supabase uses otp_expired for both expired and already used links.
const LINK_ERRORS: Record<string, AuthLinkError> = {
  otp_expired: 'expired',
  flow_state_expired: 'otherBrowser',
  flow_state_not_found: 'otherBrowser',
  bad_code_verifier: 'otherBrowser',
}

export function toAuthLinkError(error: unknown): AuthLinkError {
  if (isAuthError(error) && error.code) return LINK_ERRORS[error.code] ?? 'invalid'
  if (error instanceof Error && error.name === 'AuthPKCECodeVerifierMissingError') {
    return 'otherBrowser'
  }
  return 'invalid'
}

// Supabase reports invalid or expired email links in the query (PKCE) or hash.
export function getAuthLinkError(
  search: string,
  hash: string,
): AuthLinkError | null {
  const query = new URLSearchParams(search)
  const fragment = new URLSearchParams(hash.replace(/^#/, ''))
  const read = (key: string) => query.get(key) ?? fragment.get(key)
  if (read('error') === null && read('error_code') === null) return null
  return LINK_ERRORS[read('error_code') ?? ''] ?? 'invalid'
}

export function hasAuthLinkError(search: string, hash: string): boolean {
  return getAuthLinkError(search, hash) !== null
}
