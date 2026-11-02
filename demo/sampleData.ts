// Shared demo movements persist in this browser so both demo accounts see them.
import { currentMonth, shiftMonth, todayIso, type MonthKey } from '../src/lib/month'
import { isCategoryId } from '../src/features/expenses/categories'
import type { ExpenseCategoryId, ExpenseKind } from '../src/features/expenses/types'
import type { PendingBalance } from '../src/features/dashboard/types'
import { getDemoState, isSpaceOwner } from './demoStore'

/** A = creator of the space (Rocío), B = invited partner (Pablo). */
type Person = 'A' | 'B'

export type SampleExpense = {
  id: string
  spaceId: string
  description: string
  amountCents: number
  date: string
  categoryId: ExpenseCategoryId
  kind: ExpenseKind
  by: Person
}

export type SampleIncome = {
  id: string
  spaceId: string
  description: string
  amountCents: number
  date: string
  by: Person
}

export type SampleSettlement = {
  id: string
  spaceId: string
  date: string
  note: string | null
  amountCents: number
  by: Person
}

const expenseSeed: Omit<SampleExpense, 'id' | 'date' | 'spaceId'>[] = [
  { description: 'Alquiler', amountCents: 55000, categoryId: 'housing', kind: 'shared', by: 'B' },
  { description: 'Supermercado', amountCents: 5680, categoryId: 'food', kind: 'shared', by: 'A' },
  { description: 'Gasolina', amountCents: 4500, categoryId: 'transport', kind: 'shared', by: 'A' },
  { description: 'Internet y móvil', amountCents: 3000, categoryId: 'utilities', kind: 'shared', by: 'B' },
  { description: 'Cena fuera', amountCents: 2400, categoryId: 'leisure', kind: 'shared', by: 'A' },
  { description: 'Gimnasio', amountCents: 3500, categoryId: 'health', kind: 'individual', by: 'A' },
  { description: 'Peluquería', amountCents: 1800, categoryId: 'other', kind: 'individual', by: 'B' },
]

const incomeSeed: Omit<SampleIncome, 'id' | 'date' | 'spaceId'>[] = [
  { description: 'Nómina', amountCents: 210000, by: 'A' },
  { description: 'Nómina', amountCents: 140000, by: 'B' },
  { description: 'Venta de segunda mano', amountCents: 4500, by: 'A' },
]

// Dates never fall in the future: the current month only uses past days.
function dateIn(month: MonthKey, index: number) {
  const today = todayIso()
  const day = String(Math.max(1, 28 - index * 4)).padStart(2, '0')
  const date = `${month}-${day}`
  return date > today ? today : date
}

function seedMonth<T>(
  seed: Omit<T, 'id' | 'date' | 'spaceId'>[],
  prefix: string,
  month: MonthKey,
  spaceId: string,
): T[] {
  return seed.map((item, index) => ({
    ...item,
    id: `${prefix}-${month}-${index}`,
    spaceId,
    date: dateIn(month, index),
  }) as T)
}

type DemoMovements = {
  expenses: SampleExpense[]
  incomes: SampleIncome[]
  settlements: SampleSettlement[]
}

const MOVEMENTS_STORAGE_KEY = 'duobalance-mock-movements-v2'

function createInitialMovements(): DemoMovements {
  const now = currentMonth()
  const sampleMonths = [now, shiftMonth(now, -1)]
  return {
    expenses: sampleMonths.flatMap((month) =>
      seedMonth<SampleExpense>(expenseSeed, 'exp', month, 'space-casa'),
    ),
    incomes: sampleMonths.flatMap((month) =>
      seedMonth<SampleIncome>(incomeSeed, 'inc', month, 'space-casa'),
    ),
    settlements: [
      {
        id: 'set-0',
        spaceId: 'space-casa',
        date: dateIn(shiftMonth(now, -1), 0),
        note: 'Bizum del mes',
        amountCents: 10000,
        by: 'A',
      },
    ],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isSampleExpense(value: unknown): value is SampleExpense {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.spaceId === 'string' &&
    typeof value.description === 'string' &&
    typeof value.amountCents === 'number' &&
    Number.isInteger(value.amountCents) &&
    typeof value.date === 'string' &&
    typeof value.categoryId === 'string' &&
    isCategoryId(value.categoryId) &&
    (value.kind === 'shared' || value.kind === 'individual') &&
    (value.by === 'A' || value.by === 'B')
  )
}

function isSampleIncome(value: unknown): value is SampleIncome {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.spaceId === 'string' &&
    typeof value.description === 'string' &&
    typeof value.amountCents === 'number' &&
    Number.isInteger(value.amountCents) &&
    typeof value.date === 'string' &&
    (value.by === 'A' || value.by === 'B')
  )
}

function isSampleSettlement(value: unknown): value is SampleSettlement {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.spaceId === 'string' &&
    typeof value.date === 'string' &&
    (typeof value.note === 'string' || value.note === null) &&
    typeof value.amountCents === 'number' &&
    Number.isInteger(value.amountCents) &&
    (value.by === 'A' || value.by === 'B')
  )
}

function isDemoMovements(value: unknown): value is DemoMovements {
  return (
    isRecord(value) &&
    Array.isArray(value.expenses) &&
    value.expenses.every(isSampleExpense) &&
    Array.isArray(value.incomes) &&
    value.incomes.every(isSampleIncome) &&
    Array.isArray(value.settlements) &&
    value.settlements.every(isSampleSettlement)
  )
}

function loadMovements(): DemoMovements {
  const initial = createInitialMovements()
  try {
    const stored = localStorage.getItem(MOVEMENTS_STORAGE_KEY)
    if (stored === null) return initial
    const parsed: unknown = JSON.parse(stored)
    if (isDemoMovements(parsed)) return parsed
    console.warn('Los movimientos demo guardados no son válidos; se han restablecido.')
  } catch (error) {
    console.warn('No se pudieron leer los movimientos demo guardados; se han restablecido.', error)
  }
  return initial
}

const storedMovements = loadMovements()
export const expenses = storedMovements.expenses
export const incomes = storedMovements.incomes
export const settlements = storedMovements.settlements

export function persistDemoMovements() {
  localStorage.setItem(
    MOVEMENTS_STORAGE_KEY,
    JSON.stringify({ expenses, incomes, settlements } satisfies DemoMovements),
  )
}

export function resetDemoMovements() {
  const initial = createInitialMovements()
  expenses.splice(0, expenses.length, ...initial.expenses)
  incomes.splice(0, incomes.length, ...initial.incomes)
  settlements.splice(0, settlements.length, ...initial.settlements)
  persistDemoMovements()
}

// Perspective of the signed-in member.
export function viewer(): Person {
  return isSpaceOwner() ? 'A' : 'B'
}

export function toMember(person: Person): 'me' | 'partner' {
  return person === viewer() ? 'me' : 'partner'
}

export function inMonth(date: string, month: MonthKey) {
  return date.startsWith(month)
}

/** Individual expenses are private: only their owner sees them. */
export function visibleExpenses(spaceId: string, month: MonthKey) {
  return expenses
    .filter((expense) => expense.spaceId === spaceId && inMonth(expense.date, month))
    .filter((expense) => expense.kind === 'shared' || expense.by === viewer())
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function sum<T extends { amountCents: number }>(items: T[]) {
  return items.reduce((total, item) => total + item.amountCents, 0)
}

/** Share of A in basis points. Illustrative only: rounding is undecided. */
export function shareOfA(spaceId: string, month: MonthKey) {
  const space = getDemoState().spaces.find((candidate) => candidate.id === spaceId)
  if (space?.splitMethod !== 'proportional') return 5000
  const monthIncomes = incomes.filter(
    (income) => income.spaceId === spaceId && inMonth(income.date, month),
  )
  const total = sum(monthIncomes)
  if (total === 0) return 5000
  return Math.round((sum(monthIncomes.filter((income) => income.by === 'A')) * 10000) / total)
}

/** Positive: B owes A. Negative: A owes B. */
export function monthDebtOfB(spaceId: string, month: MonthKey) {
  const shared = expenses.filter(
    (e) => e.spaceId === spaceId && e.kind === 'shared' && inMonth(e.date, month),
  )
  const dueByA = Math.round((sum(shared) * shareOfA(spaceId, month)) / 10000)
  return sum(shared.filter((e) => e.by === 'A')) - dueByA
}

export function accumulatedDebtOfB(spaceId: string, untilMonth: MonthKey) {
  const months = new Set(
    expenses
      .filter((expense) => expense.spaceId === spaceId)
      .map((e) => e.date.slice(0, 7))
      .filter((month) => month <= untilMonth),
  )
  let debt = [...months].reduce((total, month) => total + monthDebtOfB(spaceId, month), 0)
  for (const settlement of settlements) {
    if (settlement.spaceId !== spaceId) continue
    if (settlement.date.slice(0, 7) > untilMonth) continue
    debt += settlement.by === 'B' ? -settlement.amountCents : settlement.amountCents
  }
  return debt
}

/** Converts a signed debt of B into the pending balance seen by the viewer. */
export function toPending(debtOfB: number): PendingBalance {
  if (debtOfB === 0) return { amountCents: 0, debtor: null }
  const debtor: 'me' | 'partner' = toMember(debtOfB > 0 ? 'B' : 'A')
  return { amountCents: Math.abs(debtOfB), debtor }
}

let nextId = 0
export function newId(prefix: string) {
  nextId += 1
  return `${prefix}-new-${Date.now()}-${nextId}`
}
