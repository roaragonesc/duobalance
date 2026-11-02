import { demoDelay, demoUserFromId, updateDemoState } from './demoStore'

export {
  DISPLAY_NAME_MAX_LENGTH,
  validateDisplayName,
} from '../src/features/auth/services/profileService'

export async function updateDisplayName(userId: string, name: string): Promise<string> {
  await demoDelay()
  const key = demoUserFromId(userId)
  const displayName = name.trim()
  updateDemoState((state) => ({ ...state, names: { ...state.names, [key]: displayName } }))
  return displayName
}
