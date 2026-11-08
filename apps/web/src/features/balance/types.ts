// Data contract of the balance screen. Every amount is in integer cents and
// is calculated by the API with the split stored on each expense, so
// changing the global split method does not alter past months.

export type Member = 'me' | 'partner'

export type PendingBalance = {
  amountCents: number
  /** Who owes the pending amount; null when everything is settled. */
  debtor: Member | null
}

export type MemberContribution = {
  /** Share of the shared expenses, in basis points (5000 = 50 %). */
  shareBasisPoints: number
  /** Amount the member should contribute this month. */
  contributionCents: number
}

export type Settlement = {
  id: string
  /** Local date "YYYY-MM-DD". */
  date: string
  note: string | null
  amountCents: number
  paidBy: Member
}

export type BalanceMonth = {
  /** What this month leaves pending. */
  month: PendingBalance
  /** Pending debt including previous months and settlements. */
  accumulated: PendingBalance
  members: Record<Member, MemberContribution>
  summary: {
    incomesCents: number
    sharedExpensesCents: number
    /** Incomes minus shared expenses of the month. */
    remainingCents: number
  }
  settlements: Settlement[]
}

export type SettlementInput = {
  amountCents: number
  date: string
  note: string | null
}