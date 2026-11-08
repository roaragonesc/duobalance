import type { MonthKey } from '../src/lib/month'
import type { Expense, ExpenseInput, ExpenseMonth } from '../src/features/expenses/types'
import { demoDelay, hasSampleData } from './demoStore'
import {
  expenses,
  monthDebtOfB,
  newId,
  sum,
  toMember,
  toPending,
  viewer,
  visibleExpenses,
  persistDemoMovements,
  type SampleExpense,
} from './sampleData'

export { getExpenseErrorMessage } from '../src/features/expenses/expenseService'

function toExpense({ by, ...expense }: SampleExpense): Expense {
  const paidBy = toMember(by)
  return { ...expense, paidBy, canEdit: paidBy === 'me' }
}

export async function getMonthExpenses(spaceId: string, month: MonthKey): Promise<ExpenseMonth | null> {
  await demoDelay()
  if (!hasSampleData(spaceId)) return null
  const visible = visibleExpenses(spaceId, month)
  const shared = visible.filter((expense) => expense.kind === 'shared')
  return {
    totalCents: sum(visible),
    sharedCents: sum(shared),
    individualCents: sum(visible) - sum(shared),
    pending: toPending(monthDebtOfB(spaceId, month)),
    expenses: visible.map(toExpense),
  }
}

export async function getExpense(id: string): Promise<Expense | null> {
  await demoDelay()
  const expense = expenses.find((candidate) => candidate.id === id)
  if (!expense || !hasSampleData(expense.spaceId) ||
      (expense.kind === 'individual' && expense.by !== viewer())) return null
  return toExpense(expense)
}

// Only the creator may edit or delete, as the database will enforce.
function ownExpenseIndex(id: string) {
  const index = expenses.findIndex(
    (expense) => expense.id === id && expense.by === viewer() && hasSampleData(expense.spaceId),
  )
  if (index === -1) throw new Error('Not allowed')
  return index
}

export async function saveExpense(spaceId: string, input: ExpenseInput, id?: string): Promise<void> {
  await demoDelay()
  if (!hasSampleData(spaceId)) throw new Error('No tienes acceso a este espacio.')
  if (id) {
    const index = ownExpenseIndex(id)
    if (expenses[index].spaceId !== spaceId) throw new Error('El gasto pertenece a otro espacio.')
    expenses[index] = { ...expenses[index], ...input }
  } else {
    expenses.push({ ...input, id: newId('exp'), spaceId, by: viewer() })
  }
  await persistDemoMovements()
}

export async function deleteExpense(id: string): Promise<void> {
  await demoDelay()
  expenses.splice(ownExpenseIndex(id), 1)
  await persistDemoMovements()
}
