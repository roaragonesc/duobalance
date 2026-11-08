import type { FieldErrors } from '../../hooks/useValidatedForm'
import { validateEmail } from '../auth/validation'
import type { SplitMethod } from './types/space'

export const SPACE_NAME_MAX_LENGTH = 60

export type CreateSpaceValues = {
  name: string
  splitMethod: SplitMethod
}

export type InvitePartnerValues = {
  email: string
}

export function validateCreateSpace(
  values: CreateSpaceValues,
): FieldErrors<CreateSpaceValues> {
  const name = values.name.trim()
  if (!name) return { name: 'El nombre del espacio es obligatorio.' }
  if (name.length > SPACE_NAME_MAX_LENGTH) {
    return {
      name: `El nombre no puede superar los ${SPACE_NAME_MAX_LENGTH} caracteres.`,
    }
  }
  return {}
}

export function validateInvitePartner(
  values: InvitePartnerValues,
): FieldErrors<InvitePartnerValues> {
  const email = validateEmail(values.email)
  return email ? { email } : {}
}
