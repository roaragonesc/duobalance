import { describe, expect, it } from 'vitest'
import {
  amountToCents,
  centsToAmountInput,
  validateAmount,
  validateConcept,
  validatePastDate,
} from '../../../src/lib/formValidation'

describe('formValidation', () => {
  it('TC50_validarConcepto', () => {
    expect(validateConcept('  ')).toBe('El concepto es obligatorio.')
    expect(validateConcept('a'.repeat(81))).toMatch(/80 caracteres/)
    expect(validateConcept('Nómina')).toBeUndefined()
  })

  it('TC51_validarImportesEnEuros', () => {
    expect(validateAmount('')).toBe('El importe es obligatorio.')
    expect(validateAmount('12,345')).toMatch(/importe válido/)
    expect(validateAmount('0')).toBe('El importe debe ser mayor que 0.')
    expect(validateAmount('1000000,01')).toMatch(/1\.000\.000/)
    expect(validateAmount('12,5')).toBeUndefined()
  })

  it('TC52_rechazarFechasInvalidasOFuturas', () => {
    expect(validatePastDate('2026-02-30', '2026-11-05')).toBe('Introduce una fecha válida.')
    expect(validatePastDate('2026-11-06', '2026-11-05')).toMatch(/posterior a hoy/)
    expect(validatePastDate('2026-11-05', '2026-11-05')).toBeUndefined()
  })

  it('TC53_convertirEntreTextoDeEntradaYCentimos', () => {
    expect(amountToCents('1234,5')).toBe(123450)
    expect(centsToAmountInput(123450)).toBe('1234,50')
  })
})