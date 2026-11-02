import { BackendUnavailableError } from '../../../lib/backend'
import { getSupabaseClient } from '../../../lib/supabase/client'
import type { CreateSpaceData, SplitMethod } from '../types/space'

// Error codes raised by the PostgreSQL functions of the spaces migrations.
const SPACE_ERROR_CODES = [
  'not_authenticated',
  'already_in_space',
  'space_full',
  'not_space_owner',
  'cannot_invite_self',
  'invalid_email',
  'too_many_invitations',
  'invalid_invitation',
  'invitation_used',
  'invitation_expired',
  'invitation_email_mismatch',
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

function toSpaceError(error: { message: string }): Error {
  const code = SPACE_ERROR_CODES.find((value) => value === error.message)
  return code ? new SpaceError(code) : new Error(error.message)
}

// Creates the space and its owner membership atomically in PostgreSQL.
export async function createSpace(data: CreateSpaceData): Promise<string> {
  const { data: spaceId, error } = await getSupabaseClient().rpc(
    'create_space',
    { p_name: data.name, p_split_method: data.splitMethod },
  )
  if (error) throw toSpaceError(error)
  return spaceId
}

// RLS only exposes the caller's own membership.
export async function getCurrentSpaceId(userId: string): Promise<string | null> {
  const { data, error } = await getSupabaseClient()
    .from('space_members')
    .select('space_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data?.space_id ?? null
}

export type Workspace = {
  displayName: string
  space: {
    id: string
    name: string
    splitMethod: SplitMethod
    role: 'owner' | 'member'
    memberCount: number
    /** Null until the partner joins (or if their profile is not readable). */
    partnerName: string | null
  } | null
}

// RLS returns only the caller's profile, the partner's profile and the
// members of the caller's space.
export async function getCurrentWorkspace(userId: string): Promise<Workspace> {
  const client = getSupabaseClient()
  const [profiles, members] = await Promise.all([
    client.from('profiles').select('id, display_name'),
    client.from('space_members').select('space_id, user_id, role'),
  ])
  if (profiles.error) throw profiles.error
  if (members.error) throw members.error

  const nameOf = (id: string) =>
    profiles.data.find((profile) => profile.id === id)?.display_name ?? null
  const displayName = nameOf(userId)
  if (displayName === null) throw new Error('Profile not found')

  const own = members.data.find((member) => member.user_id === userId)
  if (!own) return { displayName, space: null }

  const { data: space, error } = await client
    .from('spaces')
    .select('id, name, split_method')
    .eq('id', own.space_id)
    .single()
  if (error) throw error

  const spaceMembers = members.data.filter((m) => m.space_id === own.space_id)
  const partner = spaceMembers.find((m) => m.user_id !== userId)

  return {
    displayName,
    space: {
      id: space.id,
      name: space.name,
      splitMethod: space.split_method,
      role: own.role,
      memberCount: spaceMembers.length,
      partnerName: partner ? nameOf(partner.user_id) : null,
    },
  }
}
export const INVITATION_PATH = '/join'

// Returns the one-time invitation link; only its hash is stored.
export async function invitePartner(email: string): Promise<string> {
  const { data: token, error } = await getSupabaseClient().rpc(
    'create_invitation',
    { p_email: email },
  )
  if (error) throw toSpaceError(error)
  const url = new URL(INVITATION_PATH, window.location.origin)
  url.searchParams.set('token', token)
  return url.toString()
}

export async function acceptInvitation(token: string): Promise<string> {
  const { data: spaceId, error } = await getSupabaseClient().rpc(
    'accept_invitation',
    { p_token: token },
  )
  if (error) throw toSpaceError(error)
  return spaceId
}

// The spaces table has no update grant yet: changing the global split method
// needs its own migration (who may change it is still to be decided). New
// expenses will use the new method; existing ones keep their split.
export async function updateSplitMethod(
  _spaceId: string,
  _splitMethod: SplitMethod,
): Promise<void> {
  throw new BackendUnavailableError('Split method')
}