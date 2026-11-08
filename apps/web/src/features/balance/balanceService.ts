import type { BalanceMonth, Settlement, SettlementInput, PendingBalance } from './types'
import { currentMonth, type MonthKey } from '../../lib/month'
import { http, HttpError } from '../../services/api/http'

export class SettlementLimitError extends Error {
  constructor() {
    super('Settlement exceeds the pending debt')
    this.name = 'SettlementLimitError'
  }
}

export async function getMonthBalance(spaceId: string, month: MonthKey): Promise<BalanceMonth | null> {
  const result = await http<BalanceMonth>(`/spaces/${spaceId}/balance?month=${month}`)
  return result.summary.sharedExpensesCents || result.summary.incomesCents || result.settlements.length ? result : null
}

export async function getPendingDebt(spaceId: string): Promise<PendingBalance> {
  return (await http<BalanceMonth>(`/spaces/${spaceId}/balance?month=${currentMonth()}`)).accumulated
}

export async function getSettlementHistory(spaceId: string): Promise<Settlement[]> {
  const [{ settlements }, { user }] = await Promise.all([
    http<{ settlements: { _id: string; fromUserId: string; date: string; note: string | null; amountCents: number }[] }>(`/spaces/${spaceId}/settlements`),
    http<{ user: { id: string } }>('/users/me'),
  ])
  return settlements.map((item) => ({
    id: item._id, date: item.date, note: item.note, amountCents: item.amountCents,
    paidBy: item.fromUserId === user.id ? 'me' : 'partner',
  }))
}

export async function registerSettlement(spaceId: string, input: SettlementInput): Promise<void> {
  try {
    await http(`/spaces/${spaceId}/settlements`, 'POST', input)
  } catch (error) {
    if (error instanceof HttpError && error.code === 'settlement_limit') throw new SettlementLimitError()
    throw error
  }
}

export function getSettlementErrorMessage(error: unknown): string {
  if (error instanceof SettlementLimitError) {
    return 'El importe supera la deuda pendiente actual. Revisa el balance e inténtalo de nuevo.'
  }
  return error instanceof HttpError ? error.message : 'No se ha podido registrar la liquidación. Inténtalo de nuevo.'
}
