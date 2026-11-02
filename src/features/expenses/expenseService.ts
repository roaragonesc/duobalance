import type { MonthKey } from '../../lib/month'
import type { Expense, ExpenseInput, ExpenseMonth } from './types'

// The expenses table and its RLS policies arrive with the expenses migration.
// Until then reads return no data and writes fail explicitly: nothing is
// simulated. These functions will call Supabase with the same signatures.

export class ExpensesUnavailableError extends Error {
  constructor() {
    super('Expenses backend is not connected yet')
    this.name = 'ExpensesUnavailableError'
  }
}

export async function getMonthExpenses(
  _spaceId: string,
  _month: MonthKey,
): Promise<ExpenseMonth | null> {
  return null
}

export async function getExpense(_id: string): Promise<Expense | null> {
  return null
}

export async function saveExpense(
  _spaceId: string,
  _input: ExpenseInput,
  _id?: string,
): Promise<void> {
  throw new ExpensesUnavailableError()
}

export async function deleteExpense(_id: string): Promise<void> {
  throw new ExpensesUnavailableError()
}

export function getExpenseErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ExpensesUnavailableError) {
    return 'Todavía no se pueden guardar gastos: falta conectar la base de datos de gastos.'
  }
  return fallback
}
