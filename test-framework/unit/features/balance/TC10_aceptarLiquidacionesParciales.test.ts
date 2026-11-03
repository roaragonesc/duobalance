import { describe, expect, it } from 'vitest'
import { formatShareBasisPoints, toSettlementInput, validateSettlement } from '../../../../src/features/balance/validation'

const today = '2026-11-05'

describe('validateSettlement', () => {
  it('TC10_aceptarLiquidacionesParciales', () => {
    expect(validateSettlement({ amount: '20', date: today, note: '' }, 5000, today)).toEqual({})
  })

  it('TC11_aceptarLiquidacionDeTodaLaDeuda', () => {
    expect(validateSettlement({ amount: '50', date: today, note: '' }, 5000, today)).toEqual({})
  })

  it('TC12_rechazarImportesSuperioresALaDeudaPendiente', () => {
    const errors = validateSettlement({ amount: '50,01', date: today, note: '' }, 5000, today)
    expect(errors.amount).toMatch(/no puede superar la deuda pendiente/)
  })

  it('TC13_rechazarFechasFuturasYNotasLargas', () => {
    const errors = validateSettlement(
      { amount: '10', date: '2026-11-06', note: 'a'.repeat(81) },
      5000,
      today,
    )
    expect(errors.date).toMatch(/posterior a hoy/)
    expect(errors.note).toMatch(/80 caracteres/)
  })

  it('TC14_construirEntradaEnCentimosConNotaOpcional', () => {
    expect(toSettlementInput({ amount: '12,5', date: today, note: '  ' })).toEqual({
      amountCents: 1250,
      date: today,
      note: null,
    })
  })

  it('TC15_formatearPuntosBasicosComoPorcentaje', () => {
    expect(formatShareBasisPoints(5000)).toBe('50 %')
    expect(formatShareBasisPoints(6250)).toBe('62,5 %')
  })
})