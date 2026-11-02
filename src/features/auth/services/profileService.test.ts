import { describe, expect, it } from 'vitest'
import { validateDisplayName } from './profileService'

describe('validateDisplayName', () => {
  it('requires a name of up to 80 characters', () => {
    expect(validateDisplayName('   ')).toBe('El nombre es obligatorio.')
    expect(validateDisplayName('a'.repeat(81))).toMatch(/80 caracteres/)
    expect(validateDisplayName(' Rocío Aragón ')).toBeUndefined()
  })
})