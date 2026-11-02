import {
  INVITATION_PATH,
  SpaceError,
  type Workspace,
} from '../src/features/spaces/services/spaceService'
import type { CreateSpaceData, SplitMethod } from '../src/features/spaces/types/space'
import {
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
  updateDemoState((state) => ({
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
  const { names } = getDemoState()
  const space = getDemoSpace(key)
  if (!space) return { displayName: names[key], space: null }
  const partner = space.members.find((member) => member !== key)
  return {
    displayName: names[key],
    space: {
      id: space.id,
      name: space.name,
      splitMethod: space.splitMethod,
      role: space.owner === key ? 'owner' : 'member',
      memberCount: space.members.length,
      partnerName: partner ? names[partner] : null,
    },
  }
}

// The demo cannot send emails or accept links: it only returns a sample link.
export async function invitePartner(_email: string): Promise<string> {
  await demoDelay()
  const user = currentUser()
  const space = getDemoSpace(user)
  if (!space || space.owner !== user) throw new SpaceError('not_space_owner')
  if (space.members.length === 2) throw new SpaceError('space_full')
  const url = new URL(INVITATION_PATH, window.location.origin)
  url.searchParams.set('token', 'enlace-de-demostracion')
  return url.toString()
}

export async function acceptInvitation(_token: string): Promise<string> {
  await demoDelay()
  throw new SpaceError('invalid_invitation')
}

export async function updateSplitMethod(spaceId: string, splitMethod: SplitMethod): Promise<void> {
  await demoDelay()
  updateDemoState((state) => ({
    ...state,
    spaces: state.spaces.map((space) =>
      space.id === spaceId ? { ...space, splitMethod } : space,
    ),
  }))
}
