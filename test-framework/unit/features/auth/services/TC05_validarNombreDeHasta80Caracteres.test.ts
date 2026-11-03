import { describe, expect, it } from 'vitest'
import { validateDisplayName } from '../../../../../src/features/auth/services/profileService'

describe('validateDisplayName', () => {
  it('TC05_validarNombreDeHasta80Caracteres', () => {
    expect(validateDisplayName('   ')).toBe('El nombre es obligatorio.')
    expect(validateDisplayName('a'.repeat(81))).toMatch(/80 caracteres/)
    expect(validateDisplayName(' Rocío ')).toBeUndefined()
  })
})