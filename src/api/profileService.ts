import { http } from './http'
export { DISPLAY_NAME_MAX_LENGTH, validateDisplayName } from '../features/auth/services/profileService'

export async function updateDisplayName(_userId: string, name: string): Promise<string> {
  return (await http<{ user: { name: string } }>('/users/me', 'PATCH', { name })).user.name
}
