import { currentMonth, type MonthKey } from '../src/lib/month'
import type { PendingBalance } from '../src/features/dashboard/types'
import type { BalanceMonth, Settlement, SettlementInput } from '../src/features/balance/types'
import { SettlementLimitError } from '../src/features/balance/balanceService'
import { demoDelay, hasSampleData } from './demoStore'
import {
  accumulatedDebtOfB,
  expenses,
  incomes,
  inMonth,
  monthDebtOfB,
  newId,
  persistDemoMovements,
  settlements,
  shareOfA,
  sum,
  toMember,
  toPending,
  viewer,
  type SampleSettlement,
} from './sampleData'

export { SettlementLimitError, getSettlementErrorMessage } from '../src/features/balance/balanceService'

function toSettlement({ by, ...settlement }: SampleSettlement): Settlement {
  return { ...settlement, paidBy: toMember(by) }
}

const byDateDesc = (a: SampleSettlement, b: SampleSettlement) => b.date.localeCompare(a.date)

export async function getMonthBalance(spaceId: string, month: MonthKey): Promise<BalanceMonth | null> {
  await demoDelay()
  if (!hasSampleData(spaceId)) return null
  const shared = sum(
    expenses.filter(
      (e) => e.spaceId === spaceId && e.kind === 'shared' && inMonth(e.date, month),
    ),
  )
  const monthIncomes = sum(
    incomes.filter((income) => income.spaceId === spaceId && inMonth(income.date, month)),
  )
  if (shared === 0 && monthIncomes === 0) return null

  const shareA = shareOfA(spaceId, month)
  const dueA = Math.round((shared * shareA) / 10000)
  const a = { shareBasisPoints: shareA, contributionCents: dueA }
  const b = { shareBasisPoints: 10000 - shareA, contributionCents: shared - dueA }

  return {
    month: toPending(monthDebtOfB(spaceId, month)),
    accumulated: toPending(accumulatedDebtOfB(spaceId, month)),
    members: viewer() === 'A' ? { me: a, partner: b } : { me: b, partner: a },
    summary: {
      incomesCents: monthIncomes,
      sharedExpensesCents: shared,
      remainingCents: monthIncomes - shared,
    },
    settlements: settlements
      .filter((s) => s.spaceId === spaceId && inMonth(s.date, month))
      .sort(byDateDesc)
      .map(toSettlement),
  }
}

export async function getSettlementHistory(spaceId: string): Promise<Settlement[] | null> {
  await demoDelay()
  if (!hasSampleData(spaceId)) return null
  return settlements
    .filter((settlement) => settlement.spaceId === spaceId)
    .sort(byDateDesc)
    .map(toSettlement)
}

export async function getPendingDebt(spaceId: string): Promise<PendingBalance | null> {
  await demoDelay()
  if (!hasSampleData(spaceId)) return null
  return toPending(accumulatedDebtOfB(spaceId, currentMonth()))
}

// The debtor pays the creditor; never more than the pending debt.
export async function registerSettlement(spaceId: string, input: SettlementInput): Promise<void> {
  await demoDelay()
  const pending = toPending(accumulatedDebtOfB(spaceId, currentMonth()))
  if (pending.debtor === null || input.amountCents > pending.amountCents) {
    throw new SettlementLimitError()
  }
  const debtor = pending.debtor === 'me' ? viewer() : viewer() === 'A' ? 'B' : 'A'
  settlements.push({ ...input, id: newId('set'), spaceId, by: debtor })
  await persistDemoMovements()
}
