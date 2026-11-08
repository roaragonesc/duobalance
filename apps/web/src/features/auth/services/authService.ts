import type { LoginCredentials, RegistrationData } from '../types/auth'
import { http, setCsrfToken } from '../../../services/api/http'
import { AUTH_CALLBACK_PATH } from '../navigation'
import { loginResponse, messageResponse, noContent } from '../../../services/api/contracts'

export type SignUpResult = { needsEmailConfirmation: boolean }
export type EmailConfirmationType = 'signup' | 'email'
export const authChanged = 'duobalance-api-auth-changed'
export type ApiUser = { id: string; name: string; email: string; createdAt: string; confirmed: boolean }

/** Inicia sesión por cookie, guarda el token CSRF y avisa al provider para recuperar el perfil. */
export async function signIn(input: LoginCredentials): Promise<void> {
  const result = await http('/auth/login', loginResponse, 'POST', input)
  setCsrfToken(result.csrfToken)
  window.dispatchEvent(new Event(authChanged))
}

/** Solicita el alta sin iniciar sesión y devuelve que es necesaria la confirmación por correo. */
export async function signUp({ name, email, password }: RegistrationData & { redirectPath?: string }): Promise<SignUpResult> {
  await http('/auth/register', messageResponse, 'POST', { name, email, password })
  return { needsEmailConfirmation: true }
}

/** Solicita un nuevo correo de confirmación; el backend evita revelar si la cuenta existe. */
export async function resendConfirmation(email: string, _redirectPath?: string): Promise<void> {
  await http('/auth/resend-confirmation', messageResponse, 'POST', { email })
}

/** Consume el token de confirmación y redirige al login; no crea una sesión automáticamente. */
export async function confirmEmail(token: string, _type: EmailConfirmationType): Promise<void> {
  await http('/auth/confirm-email', noContent, 'POST', { token })
  window.location.assign('/login')
}

/** Solicita recuperación de contraseña y valida la respuesta pública de aceptación. */
export async function requestPasswordReset(email: string): Promise<void> {
  await http('/auth/forgot-password', messageResponse, 'POST', { email })
}

/** Envía la contraseña junto al token de la URL y limpia la sesión local tras el reset del servidor. */
export async function updatePassword(password: string): Promise<void> {
  const token = new URLSearchParams(window.location.search).get('token')
  if (!token) throw new Error('Falta el token de recuperación.')
  await http('/auth/reset-password', noContent, 'POST', { token, password })
  setCsrfToken(null)
  window.dispatchEvent(new Event(authChanged))
}

/** Revoca la sesión en el servidor y después limpia CSRF y notifica el cierre al provider. */
export async function signOut(): Promise<void> {
  await http('/auth/logout', noContent, 'POST', {})
  setCsrfToken(null)
  window.dispatchEvent(new Event(authChanged))
}

/** Construye la URL pública del callback de confirmación con destino de continuación opcional. */
export function getEmailConfirmationUrl(next?: string): string {
  const url = new URL(AUTH_CALLBACK_PATH, window.location.origin)
  if (next) url.searchParams.set('next', next)
  return url.toString()
}
