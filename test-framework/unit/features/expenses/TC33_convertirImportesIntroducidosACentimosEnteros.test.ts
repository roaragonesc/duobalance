import { describe, expect, it } from 'vitest'
import { parseAmountToCents } from '../../../../src/lib/money'
import { toExpenseInput, validateExpense, type ExpenseFormValues } from '../../../../src/features/expenses/validation'

const valid: ExpenseFormValues = {
  description: ' Supermercado ',
  amount: '56,8',
  date: '2026-11-02',
  categoryId: 'food',
  kind: 'shared',
}

describe('parseAmountToCents', () => {
  it('TC33_convertirImportesIntroducidosACentimosEnteros', () => {
    expect(parseAmountToCents('12')).toBe(1200)
    expect(parseAmountToCents('12,5')).toBe(1250)
    expect(parseAmountToCents('0.07')).toBe(7)
    expect(parseAmountToCents(' 19,99 ')).toBe(1999)
  })

  it('TC34_rechazarFormatosDeImporteInvalidos', () => {
    for (const value of ['', 'abc', '1,234', '1.000,00', '-5', '12,']) {
      expect(parseAmountToCents(value)).toBeNull()
    }
  })
})

describe('validateExpense', () => {
  it('TC35_aceptarYNormalizarGastoValido', () => {
    expect(validateExpense(valid, '2026-11-02')).toEqual({})
    expect(toExpenseInput(valid)).toEqual({
      description: 'Supermercado',
      amountCents: 5680,
      date: '2026-11-02',
      categoryId: 'food',
      kind: 'shared',
    })
  })

  it('TC36_informarDeTodosLosCamposInvalidos', () => {
    expect(
      validateExpense({
        description: '  ',
        amount: '0',
        date: '2026-02-30',
        categoryId: '',
        kind: 'individual',
      }, '2026-11-02'),
    ).toEqual({
      description: 'El concepto es obligatorio.',
      amount: 'El importe debe ser mayor que 0.',
      date: 'Introduce una fecha válida.',
      categoryId: 'Selecciona una categoría.',
    })
    expect(validateExpense({ ...valid, date: '2026-11-03' }, '2026-11-02').date).toBe(
      'La fecha no puede ser posterior a hoy.',
    )
    expect(validateExpense({ ...valid, amount: '12,345' }).amount).toBe(
      'Introduce un importe válido, por ejemplo 12,50.',
    )
  })
})
