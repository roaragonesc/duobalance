import { describe, expect, it } from 'vitest'
import { formatCents, formatShare } from '../../../src/lib/money'
import {
  formatDay,
  formatMonth,
  parseMonth,
  shiftMonth,
} from '../../../src/lib/month'

const normalize = (value: string) => value.replace(/\s/g, ' ')
const now = new Date(2026, 10, 15)

describe('money', () => {
  it('TC45_formatearCentimosEnterosComoEuros', () => {
    expect(normalize(formatCents(12345678))).toBe('123.456,78 €')
    expect(normalize(formatCents(5))).toBe('0,05 €')
  })

  it('TC46_formatearAportacionesSinDividirPorCero', () => {
    expect(formatShare(50, 100)).toBe('50%')
    expect(formatShare(1, 1000)).toBe('<1%')
    expect(formatShare(10, 0)).toBe('0%')
  })
})

describe('month', () => {
  it('TC47_usarMesActualParaValoresInvalidosOFuturos', () => {
    expect(parseMonth('2026-10', now)).toBe('2026-10')
    expect(parseMonth('2026-13', now)).toBe('2026-11')
    expect(parseMonth('2027-01', now)).toBe('2026-11')
    expect(parseMonth(null, now)).toBe('2026-11')
  })

  it('TC48_desplazarMesEntreAnos', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
  })

  it('TC49_formatearMesesYDiasEnEspanol', () => {
    expect(formatMonth('2026-11')).toBe('Noviembre 2026')
    expect(formatDay('2026-11-15', now)).toBe('Hoy')
    expect(formatDay('2026-11-14', now)).toBe('Ayer')
    expect(formatDay('2026-10-28', now)).toBe('28 oct')
  })
})
