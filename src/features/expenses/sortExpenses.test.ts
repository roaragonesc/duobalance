import { describe, expect, it } from 'vitest'
import { sortExpensesNewestFirst } from './sortExpenses'

describe('sortExpensesNewestFirst', () => {
  it('orders by expense date from newest to oldest', () => {
    const expenses = [
      { id: 'middle', date: '2026-11-02' },
      { id: 'newest', date: '2026-11-03' },
      { id: 'oldest', date: '2026-11-01' },
    ]

    expect(sortExpensesNewestFirst(expenses).map(({ id }) => id))
      .toEqual(['newest', 'middle', 'oldest'])
  })

  it('puts the last added expense first when dates match without mutating storage', () => {
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

  it('keeps expense date ahead of insertion order and handles an empty list', () => {
    expect(sortExpensesNewestFirst([
      { id: 'newer-date', date: '2026-11-03' },
      { id: 'added-later', date: '2026-11-01' },
    ]).map(({ id }) => id)).toEqual(['newer-date', 'added-later'])
    expect(sortExpensesNewestFirst([])).toEqual([])
  })
})
