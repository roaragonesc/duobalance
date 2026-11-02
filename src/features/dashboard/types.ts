import type { ExpenseCategoryId } from '../expenses/types'

// Data contract of the dashboard. Every amount is in integer cents and is
// calculated in PostgreSQL; the UI only formats it. The dashboard is the
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

export type PendingBalance = {
  amountCents: number
  /** Who owes the pending amount; null when everything is settled. */
  debtor: 'me' | 'partner' | null
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
