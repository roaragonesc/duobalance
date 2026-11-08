import { z } from 'zod'

const id = z.string().regex(/^[a-f0-9]{24}$/i)
const cents = z.number().int().safe()
const amount = cents.nonnegative()
const date = z.iso.date()
const member = z.enum(['me', 'partner'])
const categoryKey = z.enum(['food', 'housing', 'utilities', 'transport', 'leisure', 'health', 'other'])

export const noContent = z.undefined()
export const messageResponse = z.object({ message: z.string().min(1) })
export const csrfResponse = z.object({ csrfToken: z.string().regex(/^[a-f0-9]{64}$/) })
export const user = z.object({
  id, name: z.string().min(1), email: z.email(), createdAt: z.iso.datetime(), confirmed: z.boolean(),
})
export const userResponse = z.object({ user })
export const loginResponse = userResponse.extend({ csrfToken: csrfResponse.shape.csrfToken })
export const space = z.object({
  _id: id, name: z.string().min(1), createdBy: id,
  splitMethod: z.enum(['equal', 'proportional']), members: z.array(id).min(1).max(2),
})
export const spaceResponse = z.object({ space })
export const spacesResponse = z.object({ spaces: z.array(space) })
export const membersResponse = z.object({ members: z.array(z.object({ _id: id, name: z.string().min(1) })).min(1).max(2) })
export const invitationResponse = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) })
export const invitationAccepted = z.object({ spaceId: id })
export const categoriesResponse = z.object({
  categories: z.array(z.object({ _id: id, key: categoryKey.optional(), icon: categoryKey })),
})
export const pending = z.object({ amountCents: amount, debtor: member.nullable() })
const expense = z.object({
  id, description: z.string(), amountCents: amount, date, categoryId: id,
  kind: z.enum(['shared', 'individual']), paidBy: member, canEdit: z.boolean(),
})
const rawExpense = expense.omit({ id: true, paidBy: true, canEdit: true }).extend({
  _id: id, paidBy: id, createdBy: id,
})
export const expenseResponse = z.object({ expense: rawExpense })
export const expensesResponse = z.object({
  expenses: z.array(expense), totalCents: amount, sharedCents: amount, individualCents: amount, pending,
})
export const incomeResponse = z.object({ income: z.object({
  _id: id, createdBy: id, description: z.string(), date, amountCents: amount,
}) })
export const incomesResponse = z.object({
  incomes: z.array(z.object({ id, description: z.string(), date, amountCents: amount, owner: member })),
  totalCents: amount, myCents: amount, partnerCents: amount,
})
const settlement = z.object({ id, date, note: z.string().nullable(), amountCents: amount, paidBy: member })
const rawSettlement = settlement.omit({ id: true, paidBy: true }).extend({ _id: id, fromUserId: id })
export const settlementResponse = z.object({ settlement: rawSettlement })
export const settlementsResponse = z.object({ settlements: z.array(rawSettlement) })
const contribution = z.object({ shareBasisPoints: z.number().int().min(0).max(10000), contributionCents: amount })
export const balanceResponse = z.object({
  month: pending, accumulated: pending, members: z.object({ me: contribution, partner: contribution }),
  summary: z.object({ incomesCents: amount, sharedExpensesCents: amount, remainingCents: cents }),
  settlements: z.array(settlement),
})
export const dashboardResponse = z.object({
  totalCents: amount, previousMonthTotalCents: amount.nullable(),
  myContributionCents: amount, partnerContributionCents: amount, pending,
  categories: z.array(z.object({ id, name: z.string(), amountCents: amount })),
  recentExpenses: z.array(expense.pick({ id: true, categoryId: true, description: true, amountCents: true, date: true })),
})
