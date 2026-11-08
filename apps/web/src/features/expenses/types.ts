import type { PendingBalance } from '../balance/types'

// Data contract of the expenses screen. Amounts are integer cents.

export type ExpenseKind = 'shared' | 'individual'

export type ExpenseCategoryId =
  | 'food'
  | 'housing'
  | 'utilities'
  | 'transport'
  | 'leisure'
  | 'health'
  | 'other'

export type Expense = {
  id: string
  description: string
  amountCents: number
  /** Local date "YYYY-MM-DD"; it decides the month of the expense. */
  date: string
  categoryId: ExpenseCategoryId
  kind: ExpenseKind
  /** Who paid it; individual expenses are only ever returned to their owner. */
  paidBy: 'me' | 'partner'
  /** Only the creator can edit or delete an expense. */
  canEdit: boolean
}

export type ExpenseMonth = {
  totalCents: number
  sharedCents: number
  individualCents: number
  pending: PendingBalance
  expenses: Expense[]
}

export type ExpenseInput = {
  description: string
  amountCents: number
  date: string
  categoryId: ExpenseCategoryId
  kind: ExpenseKind
}
