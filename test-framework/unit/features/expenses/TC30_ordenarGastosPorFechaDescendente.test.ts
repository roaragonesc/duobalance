import { describe, expect, it } from 'vitest'
import { sortExpensesNewestFirst } from '../../../../src/features/expenses/sortExpenses'

describe('sortExpensesNewestFirst', () => {
  it('TC30_ordenarGastosPorFechaDescendente', () => {
    const expenses = [
      { id: 'middle', date: '2026-11-02' },
      { id: 'newest', date: '2026-11-03' },
      { id: 'oldest', date: '2026-11-01' },
    ]

    expect(sortExpensesNewestFirst(expenses).map(({ id }) => id))
      .toEqual(['newest', 'middle', 'oldest'])
  })

  it('TC31_priorizarUltimoGastoInsertadoEnFechasIgualesSinMutarDatos', () => {
    const expenses = [
      { id: 'first', date: '2026-11-02' },
      { id: 'second', date: '2026-11-02' },
      { id: 'third', date: '2026-11-02' },
    ]

    expect(sortExpensesNewestFirst(expenses).map(({ id }) => id))
      .toEqual(['third', 'second', 'first'])
    expect(expenses.map(({ id }) => id)).toEqual(['first', 'second', 'third'])
    expect(sortExpensesNewestFirst(expenses).map(({ id }) => id))
      .toEqual(['third', 'second', 'first'])
  })

  it('TC32_priorizarFechaSobreInsercionYAdmitirListaVacia', () => {
    expect(sortExpensesNewestFirst([
      { id: 'newer-date', date: '2026-11-03' },
      { id: 'added-later', date: '2026-11-01' },
    ]).map(({ id }) => id)).toEqual(['newer-date', 'added-later'])
    expect(sortExpensesNewestFirst([])).toEqual([])
  })
})
