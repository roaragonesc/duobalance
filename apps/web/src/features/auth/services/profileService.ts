import { http } from '../../../services/api/http'
import { userResponse } from '../../../services/api/contracts'

export const DISPLAY_NAME_MAX_LENGTH = 80

/** Valida que el nombre visible no esté vacío ni supere el límite compartido con la API. */
export function validateDisplayName(value: string): string | undefined {
  const name = value.trim()
  if (!name) return 'El nombre es obligatorio.'
  if (name.length > DISPLAY_NAME_MAX_LENGTH) {
    return `El nombre no puede superar los ${DISPLAY_NAME_MAX_LENGTH} caracteres.`
  }
  return undefined
}

/** Actualiza el nombre de la sesión actual y devuelve el valor confirmado por el servidor. */
export async function updateDisplayName(_userId: string, name: string): Promise<string> {
  return (await http('/users/me', userResponse, 'PATCH', { name })).user.name
}
