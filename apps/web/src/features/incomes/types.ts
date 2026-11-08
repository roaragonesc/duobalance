// Data contract of the incomes screen. Amounts are integer cents calculated
// by the API. Each member manages only their own incomes; the partner's
// ones are read-only.

export type IncomeOwner = 'me' | 'partner'

export type Income = {
  id: string
  description: string
  amountCents: number
  /** Local date "YYYY-MM-DD". */
  date: string
  owner: IncomeOwner
}

export type IncomeMonth = {
  totalCents: number
  myCents: number
  partnerCents: number
  incomes: Income[]
}

export type IncomeInput = {
  description: string
  amountCents: number
  date: string
}