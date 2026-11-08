import type { CreateSpaceData, SplitMethod } from '../types/space'
import { http, HttpError } from '../../../services/api/http'

const SPACE_ERROR_CODES = [
  'not_authenticated', 'already_in_space', 'space_full', 'not_space_owner',
  'cannot_invite_self', 'invalid_email', 'too_many_invitations', 'invalid_invitation',
  'invitation_used', 'invitation_expired', 'invitation_email_mismatch',
] as const

export type SpaceErrorCode = (typeof SPACE_ERROR_CODES)[number]

export class SpaceError extends Error {
  readonly code: SpaceErrorCode
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

type Space = { _id: string; name: string; createdBy: string; splitMethod: SplitMethod; members: string[] }

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

export async function createSpace(input: CreateSpaceData): Promise<string> {
  return operation(async () => (await http<{ space: Space }>('/spaces', 'POST', input)).space._id)
}

export async function getCurrentSpaceId(_userId: string): Promise<string | null> {
  return (await http<{ spaces: Space[] }>('/spaces')).spaces[0]?._id ?? null
}

export async function getCurrentWorkspace(userId: string): Promise<Workspace> {
  const [{ user }, { spaces }] = await Promise.all([
    http<{ user: { name: string } }>('/users/me'), http<{ spaces: Space[] }>('/spaces'),
  ])
  const space = spaces[0]
  if (!space) return { displayName: user.name, space: null }
  const { members } = await http<{ members: { _id: string; name: string }[] }>(`/spaces/${space._id}/members`)
  return { displayName: user.name, space: {
    id: space._id, name: space.name, splitMethod: space.splitMethod,
    role: space.createdBy === userId ? 'owner' : 'member', memberCount: members.length,
    partnerName: members.find((member) => member._id !== userId)?.name ?? null,
  } }
}

export async function invitePartner(email: string): Promise<string> {
  return operation(async () => {
    const id = await getCurrentSpaceId('')
    if (!id) throw new SpaceError('not_space_owner')
    const { token } = await http<{ token: string }>(`/spaces/${id}/invitations`, 'POST', { email })
    return new URL(`${INVITATION_PATH}?token=${token}`, window.location.origin).toString()
  })
}

export async function acceptInvitation(token: string): Promise<string> {
  return operation(async () => (await http<{ spaceId: string }>(`/invitations/${token}/accept`, 'POST', {})).spaceId)
}

export async function updateSplitMethod(id: string, splitMethod: SplitMethod): Promise<void> {
  await operation(() => http(`/spaces/${id}`, 'PATCH', { splitMethod }))
}
