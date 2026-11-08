import type { MonthKey } from '../src/lib/month'
import type { DashboardSummary } from '../src/features/dashboard/types'
import { getCategory } from '../src/features/expenses/categories'
import { demoDelay, hasSampleData } from './demoStore'
import { expenses, inMonth, monthDebtOfB, shareOfA, sum, toPending, viewer, visibleExpenses } from './sampleData'
import { shiftMonth } from '../src/lib/month'

export async function getDashboardSummary(
  spaceId: string,
  month: MonthKey,
): Promise<DashboardSummary | null> {
  await demoDelay()
  if (!hasSampleData(spaceId)) return null
  const shared = visibleExpenses(spaceId, month).filter((expense) => expense.kind === 'shared')
  if (shared.length === 0) return null

  const totalCents = sum(shared)
  const previous = expenses.filter(
    (e) =>
      e.spaceId === spaceId &&
      e.kind === 'shared' &&
      inMonth(e.date, shiftMonth(month, -1)),
  )
  const dueByA = Math.round((totalCents * shareOfA(spaceId, month)) / 10000)
  const [mine, partners] = viewer() === 'A' ? [dueByA, totalCents - dueByA] : [totalCents - dueByA, dueByA]
  const byCategory = new Map<(typeof shared)[number]['categoryId'], number>()
  for (const expense of shared) {
    byCategory.set(expense.categoryId, (byCategory.get(expense.categoryId) ?? 0) + expense.amountCents)
  }

  return {
    totalCents,
    previousMonthTotalCents: previous.length ? sum(previous) : null,
    myContributionCents: mine,
    partnerContributionCents: partners,
    pending: toPending(monthDebtOfB(spaceId, month)),
    categories: [...byCategory].map(([id, amountCents]) => ({
      id,
      name: getCategory(id).name,
      amountCents,
    })),
    recentExpenses: shared.slice(0, 3).map(({ id, categoryId, description, amountCents, date }) => ({
      id,
      categoryId,
      description,
      amountCents,
      date,
    })),
  }
}
