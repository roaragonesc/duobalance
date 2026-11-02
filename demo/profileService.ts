import { demoDelay, demoUserFromId, getDemoState, updateDemoState } from './demoStore'

export {
  DISPLAY_NAME_MAX_LENGTH,
  validateDisplayName,
} from '../src/features/auth/services/profileService'

export async function updateDisplayName(userId: string, name: string): Promise<string> {
  await demoDelay()
  const key = demoUserFromId(userId)
  const displayName = name.trim()
  const account = getDemoState().users[key]
  await updateDemoState((state) => ({
    ...state,
    users: { ...state.users, [key]: { ...account, name: displayName } },
  }))
  return displayName
}
