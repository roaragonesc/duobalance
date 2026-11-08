import type { ExpenseCategoryId } from '../expenses/types'
import type { PendingBalance } from '../balance/types'

export type { PendingBalance } from '../balance/types'

// Data contract of the dashboard. Every amount is in integer cents and is
// calculated by the API; the UI only formats it. The dashboard is the
// couple's common summary: it only includes shared expenses (individual ones
// are private and only appear in the expenses screen).

export type DashboardCategory = {
  id: string
  name: string
  amountCents: number
}

export type DashboardExpense = {
  id: string
  categoryId: ExpenseCategoryId
  description: string
  amountCents: number
  /** Local date "YYYY-MM-DD". */
  date: string
}

export type DashboardSummary = {
  totalCents: number
  previousMonthTotalCents: number | null
  myContributionCents: number
  partnerContributionCents: number
  pending: PendingBalance
  categories: DashboardCategory[]
  recentExpenses: DashboardExpense[]
}
