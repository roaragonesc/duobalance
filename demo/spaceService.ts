import {
  INVITATION_PATH,
  SpaceError,
  type Workspace,
} from '../src/features/spaces/services/spaceService'
import type { CreateSpaceData, SplitMethod } from '../src/features/spaces/types/space'
import { demoUrl } from './navigation'
import {
  createDemoToken,
  demoDelay,
  demoUserFromId,
  getDemoSpace,
  getDemoState,
  updateDemoState,
  type DemoUserKey,
} from './demoStore'

export { INVITATION_PATH, SpaceError }
export type { SpaceErrorCode, Workspace } from '../src/features/spaces/services/spaceService'

function currentUser(): DemoUserKey {
  const { user } = getDemoState()
  if (!user) throw new SpaceError('not_authenticated')
  return user
}

export async function createSpace(data: CreateSpaceData): Promise<string> {
  await demoDelay()
  const user = currentUser()
  if (getDemoSpace(user)) throw new SpaceError('already_in_space')
  const id = `space-${user}-${Date.now()}`
  await updateDemoState((state) => ({
    ...state,
    spaces: [
      ...state.spaces,
      { id, name: data.name.trim(), splitMethod: data.splitMethod, owner: user, members: [user] },
    ],
  }))
  return id
}

export async function getCurrentSpaceId(userId: string): Promise<string | null> {
  await demoDelay()
  return getDemoSpace(demoUserFromId(userId))?.id ?? null
}

export async function getCurrentWorkspace(userId: string): Promise<Workspace> {
  await demoDelay()
  const key = demoUserFromId(userId)
  const account = getDemoState().users[key]
  const space = getDemoSpace(key)
  if (!space) return { displayName: account.name, space: null }
  const partner = space.members.find((member) => member !== key)
  return {
    displayName: account.name,
    space: {
      id: space.id,
      name: space.name,
      splitMethod: space.splitMethod,
      role: space.owner === key ? 'owner' : 'member',
      memberCount: space.members.length,
      partnerName: partner ? getDemoState().users[partner]?.name ?? null : null,
    },
  }
}

export async function invitePartner(email: string): Promise<string> {
  await demoDelay()
  const user = currentUser()
  const normalizedEmail = email.trim().toLowerCase()
  const state = getDemoState()
  const space = getDemoSpace(user)
  if (!space || !space.members.includes(user)) throw new SpaceError('not_space_owner')
  if (space.members.length >= 2) throw new SpaceError('space_full')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new SpaceError('invalid_email')
  }
  if (state.users[user]?.email === normalizedEmail) throw new SpaceError('cannot_invite_self')

  const token = createDemoToken()
  const createdAt = new Date()
  await updateDemoState((current) => ({
    ...current,
    invitations: [
      ...current.invitations,
      {
        token,
        email: normalizedEmail,
        spaceId: space.id,
        createdAt: createdAt.toISOString(),
        expiresAt: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        used: false,
      },
    ],
  }))
  return demoUrl(INVITATION_PATH, { token })
}

export async function acceptInvitation(token: string): Promise<string> {
  await demoDelay()
  const user = currentUser()
  const state = getDemoState()
  const invitation = state.invitations.find((candidate) => candidate.token === token)
  if (!invitation) throw new SpaceError('invalid_invitation')
  if (invitation.used) throw new SpaceError('invitation_used')
  if (Date.parse(invitation.expiresAt) <= Date.now()) {
    throw new SpaceError('invitation_expired')
  }
  if (state.users[user]?.email !== invitation.email) {
    throw new SpaceError('invitation_email_mismatch')
  }
  if (getDemoSpace(user)) throw new SpaceError('already_in_space')
  const space = state.spaces.find((candidate) => candidate.id === invitation.spaceId)
  if (!space) throw new SpaceError('invalid_invitation')
  if (space.members.length >= 2) throw new SpaceError('space_full')

  await updateDemoState((current) => ({
    ...current,
    spaces: current.spaces.map((candidate) =>
      candidate.id === invitation.spaceId
        ? { ...candidate, members: [...candidate.members, user] }
        : candidate,
    ),
    invitations: current.invitations.map((candidate) =>
      candidate.token === token ? { ...candidate, used: true } : candidate,
    ),
  }))
  return space.id
}

export async function updateSplitMethod(spaceId: string, splitMethod: SplitMethod): Promise<void> {
  await demoDelay()
  const user = currentUser()
  const space = getDemoState().spaces.find((candidate) => candidate.id === spaceId)
  if (!space || space.owner !== user) throw new SpaceError('not_space_owner')
  await updateDemoState((state) => ({
    ...state,
    spaces: state.spaces.map((candidate) =>
      candidate.id === spaceId ? { ...candidate, splitMethod } : candidate,
    ),
  }))
}
