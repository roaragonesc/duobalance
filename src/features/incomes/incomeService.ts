import { BackendUnavailableError } from '../../lib/backend'
import type { MonthKey } from '../../lib/month'
import type { Income, IncomeInput, IncomeMonth } from './types'

// The incomes table and its RLS policies arrive with the incomes migration.
// These functions will call Supabase with the same signatures.

export async function getMonthIncomes(
  _spaceId: string,
  _month: MonthKey,
): Promise<IncomeMonth | null> {
  return null
}

/** Only returns the income if it belongs to the current user. */
export async function getOwnIncome(_id: string): Promise<Income | null> {
  return null
}

export async function saveIncome(
  _spaceId: string,
  _input: IncomeInput,
  _id?: string,
): Promise<void> {
  throw new BackendUnavailableError('Incomes')
}

export async function deleteIncome(_id: string): Promise<void> {
  throw new BackendUnavailableError('Incomes')
}

export function getIncomeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof BackendUnavailableError) {
    return 'Todavía no se pueden guardar ingresos: falta conectar la base de datos de ingresos.'
  }
  return fallback
}