import { BackendUnavailableError } from '../../lib/backend'
import type { MonthKey } from '../../lib/month'
import type { PendingBalance } from '../dashboard/types'
import type { BalanceMonth, Settlement, SettlementInput } from './types'

// The settlements table and the balance functions arrive with their
// migration. These functions will call Supabase with the same signatures.

export class SettlementLimitError extends Error {
  constructor() {
    super('Settlement exceeds the pending debt')
    this.name = 'SettlementLimitError'
  }
}

export async function getMonthBalance(
  _spaceId: string,
  _month: MonthKey,
): Promise<BalanceMonth | null> {
  return null
}

/** Every settlement of the space, newest first. */
export async function getSettlementHistory(_spaceId: string): Promise<Settlement[] | null> {
  return null
}

/** Current accumulated debt; null while the backend is not connected. */
export async function getPendingDebt(_spaceId: string): Promise<PendingBalance | null> {
  return null
}

// PostgreSQL must reject settlements above the pending debt too.
export async function registerSettlement(
  _spaceId: string,
  _input: SettlementInput,
): Promise<void> {
  throw new BackendUnavailableError('Settlements')
}

export function getSettlementErrorMessage(error: unknown) {
  if (error instanceof BackendUnavailableError) {
    return 'Todavía no se pueden registrar liquidaciones: falta conectar la base de datos de balance.'
  }
  if (error instanceof SettlementLimitError) {
    return 'El importe supera la deuda pendiente actual. Revisa el balance e inténtalo de nuevo.'
  }
  return 'No se ha podido registrar la liquidación. Inténtalo de nuevo.'
}