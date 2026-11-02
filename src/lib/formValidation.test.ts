import { describe, expect, it } from 'vitest'
import {
  amountToCents,
  centsToAmountInput,
  validateAmount,
  validateConcept,
  validatePastDate,
} from './formValidation'

describe('formValidation', () => {
  it('validates the concept', () => {
    expect(validateConcept('  ')).toBe('El concepto es obligatorio.')
    expect(validateConcept('a'.repeat(81))).toMatch(/80 caracteres/)
    expect(validateConcept('Nómina')).toBeUndefined()
  })

  it('validates amounts in euros', () => {
    expect(validateAmount('')).toBe('El importe es obligatorio.')
    expect(validateAmount('12,345')).toMatch(/importe válido/)
    expect(validateAmount('0')).toBe('El importe debe ser mayor que 0.')
    expect(validateAmount('1000000,01')).toMatch(/1\.000\.000/)
    expect(validateAmount('12,5')).toBeUndefined()
  })

  it('rejects invalid and future dates', () => {
    expect(validatePastDate('2026-02-30', '2026-11-05')).toBe('Introduce una fecha válida.')
    expect(validatePastDate('2026-11-06', '2026-11-05')).toMatch(/posterior a hoy/)
    expect(validatePastDate('2026-11-05', '2026-11-05')).toBeUndefined()
  })

  it('converts between input text and cents', () => {
    expect(amountToCents('1234,5')).toBe(123450)
    expect(centsToAmountInput(123450)).toBe('1234,50')
  })
})