import { http } from '../../../services/api/http'

export const DISPLAY_NAME_MAX_LENGTH = 80

export function validateDisplayName(value: string): string | undefined {
  const name = value.trim()
  if (!name) return 'El nombre es obligatorio.'
  if (name.length > DISPLAY_NAME_MAX_LENGTH) {
    return `El nombre no puede superar los ${DISPLAY_NAME_MAX_LENGTH} caracteres.`
  }
  return undefined
}

export async function updateDisplayName(_userId: string, name: string): Promise<string> {
  return (await http<{ user: { name: string } }>('/users/me', 'PATCH', { name })).user.name
}
