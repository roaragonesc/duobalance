import type { BalanceMonth, Settlement, SettlementInput } from '../features/balance/types'
import type { PendingBalance } from '../features/dashboard/types'
import { SettlementLimitError } from '../features/balance/balanceService'
import { currentMonth } from '../lib/month'
import { http, HttpError } from './http'
export { SettlementLimitError, getSettlementErrorMessage } from '../features/balance/balanceService'

export async function getMonthBalance(spaceId: string, month: string): Promise<BalanceMonth | null> {
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
  try { await http(`/spaces/${spaceId}/settlements`, 'POST', input) } catch (error) {
    if (error instanceof HttpError && error.code === 'settlement_limit') throw new SettlementLimitError()
    throw error
  }
}
