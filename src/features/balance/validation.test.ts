import { describe, expect, it } from 'vitest'
import { formatShareBasisPoints, toSettlementInput, validateSettlement } from './validation'

const today = '2026-11-05'

describe('validateSettlement', () => {
  it('accepts partial settlements', () => {
    expect(validateSettlement({ amount: '20', date: today, note: '' }, 5000, today)).toEqual({})
  })

  it('accepts settling the whole debt', () => {
    expect(validateSettlement({ amount: '50', date: today, note: '' }, 5000, today)).toEqual({})
  })

  it('rejects amounts above the pending debt', () => {
    const errors = validateSettlement({ amount: '50,01', date: today, note: '' }, 5000, today)
    expect(errors.amount).toMatch(/no puede superar la deuda pendiente/)
  })

  it('rejects future dates and long notes', () => {
    const errors = validateSettlement(
      { amount: '10', date: '2026-11-06', note: 'a'.repeat(81) },
      5000,
      today,
    )
    expect(errors.date).toMatch(/posterior a hoy/)
    expect(errors.note).toMatch(/80 caracteres/)
  })

  it('builds the input in cents with an optional note', () => {
    expect(toSettlementInput({ amount: '12,5', date: today, note: '  ' })).toEqual({
      amountCents: 1250,
      date: today,
      note: null,
    })
  })

  it('formats basis points as a percentage', () => {
    expect(formatShareBasisPoints(5000)).toBe('50 %')
    expect(formatShareBasisPoints(6250)).toBe('62,5 %')
  })
})