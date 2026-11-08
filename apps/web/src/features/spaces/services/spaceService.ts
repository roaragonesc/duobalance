import type { CreateSpaceData, SplitMethod } from '../types/space'
import { http, HttpError } from '../../../services/api/http'
import {
  spaceResponse, spacesResponse, userResponse, membersResponse,
  invitationResponse, invitationAccepted,
} from '../../../services/api/contracts'

const SPACE_ERROR_CODES = [
  'not_authenticated', 'already_in_space', 'space_full', 'not_space_owner',
  'cannot_invite_self', 'invalid_email', 'too_many_invitations', 'invalid_invitation',
  'invitation_used', 'invitation_expired', 'invitation_email_mismatch',
] as const

export type SpaceErrorCode = (typeof SPACE_ERROR_CODES)[number]

/** Error de negocio del espacio traducible a mensajes de interfaz mediante su código estable. */
export class SpaceError extends Error {
  readonly code: SpaceErrorCode
  /** Conserva un código reconocido sin incluir documentos o detalles internos del servidor. */
  constructor(code: SpaceErrorCode) {
    super(code)
    this.name = 'SpaceError'
    this.code = code
  }
}

export const INVITATION_PATH = '/join'

export type Workspace = {
  displayName: string
  space: {
    id: string
    name: string
    splitMethod: SplitMethod
    role: 'owner' | 'member'
    memberCount: number
    partnerName: string | null
  } | null
}

/** Traduce códigos HTTP conocidos a errores de espacio y propaga los demás fallos. */
async function operation<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action()
  } catch (error) {
    if (error instanceof HttpError) {
      const code = SPACE_ERROR_CODES.find((value) => value === error.code)
      if (code) throw new SpaceError(code)
    }
    throw error
  }
}

/** Crea un espacio con la sesión actual y devuelve su identificador validado. */
export async function createSpace(input: CreateSpaceData): Promise<string> {
  return operation(async () => (await http('/spaces', spaceResponse, 'POST', input)).space._id)
}

/** Consulta el espacio de la sesión; null significa ausencia real, no fallo de conexión. */
export async function getCurrentSpaceId(_userId: string): Promise<string | null> {
  return (await http('/spaces', spacesResponse)).spaces[0]?._id ?? null
}

/** Combina perfil, espacio y miembros para obtener nombre visible, rol y pareja del contexto UI. */
export async function getCurrentWorkspace(userId: string): Promise<Workspace> {
  const [{ user }, { spaces }] = await Promise.all([
    http('/users/me', userResponse), http('/spaces', spacesResponse),
  ])
  const space = spaces[0]
  if (!space) return { displayName: user.name, space: null }
  const { members } = await http(`/spaces/${space._id}/members`, membersResponse)
  return { displayName: user.name, space: {
    id: space._id, name: space.name, splitMethod: space.splitMethod,
    role: space.createdBy === userId ? 'owner' : 'member', memberCount: members.length,
    partnerName: members.find((member) => member._id !== userId)?.name ?? null,
  } }
}

/** Crea una invitación del espacio actual y devuelve el enlace que puede compartirse con la pareja. */
export async function invitePartner(email: string): Promise<string> {
  return operation(async () => {
    const id = await getCurrentSpaceId('')
    if (!id) throw new SpaceError('not_space_owner')
    const { token } = await http(`/spaces/${id}/invitations`, invitationResponse, 'POST', { email })
    return new URL(`${INVITATION_PATH}?token=${token}`, window.location.origin).toString()
  })
}

/** Acepta la invitación usando la sesión del destinatario y devuelve el ID del espacio. */
export async function acceptInvitation(token: string): Promise<string> {
  return operation(async () => (await http(`/invitations/${token}/accept`, invitationAccepted, 'POST', {})).spaceId)
}

/** Solicita cambiar el reparto global del espacio; el servidor verifica la autorización del creador. */
export async function updateSplitMethod(id: string, splitMethod: SplitMethod): Promise<void> {
  await operation(() => http(`/spaces/${id}`, spaceResponse, 'PATCH', { splitMethod }))
}
