import { SupabaseNotConfiguredError } from '../../../lib/supabase/client'
import { SpaceError, type SpaceErrorCode } from './spaceService'

const MESSAGES: Record<SpaceErrorCode, string> = {
  not_authenticated: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',
  already_in_space: 'Ya formas parte de un espacio compartido.',
  space_full: 'Este espacio ya tiene dos miembros.',
  not_space_owner: 'Solo quien creó el espacio puede invitar a su pareja.',
  cannot_invite_self: 'No puedes invitarte a ti mismo. Usa el correo de tu pareja.',
  invalid_email: 'Introduce un correo electrónico válido.',
  too_many_invitations:
    'Has creado demasiadas invitaciones hoy. Inténtalo de nuevo mañana.',
  invalid_invitation:
    'Esta invitación no es válida. Pide a tu pareja que te envíe un enlace nuevo.',
  invitation_used: 'Esta invitación ya se ha utilizado.',
  invitation_expired:
    'Esta invitación ha caducado. Pide a tu pareja que te envíe un enlace nuevo.',
  invitation_email_mismatch:
    'Esta invitación es para otro correo electrónico. Inicia sesión con la cuenta invitada.',
}

export function getSpaceErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof SpaceError) return MESSAGES[error.code]
  if (error instanceof SupabaseNotConfiguredError) {
    return 'El servicio todavía no está configurado.'
  }
  if (error instanceof TypeError) {
    return 'No se ha podido conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.'
  }
  return fallback
}