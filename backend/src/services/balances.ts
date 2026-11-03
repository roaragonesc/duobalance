import type { ClientSession } from 'mongoose'
import { Expense, Income, Settlement } from '../models/finance.js'
import { memberSpace, mutateSpace } from '../repositories/finance.js'
import { allocation, pending, safeSum } from './calculations.js'
import { ApiError } from '../utils/ApiError.js'

export async function debt(spaceId: string, ownerId: string, until: string, session?: ClientSession, onlyMonth?: string) {
  const expenses = await Expense.find({
    spaceId, kind: 'shared', date: onlyMonth ? { $gte: `${onlyMonth}-01`, $lte: `${onlyMonth}-31` } : { $lte: `${until}-31` },
  }).session(session ?? null)
  let total = safeSum(expenses.map((expense) =>
    (expense.paidBy.toString() === ownerId ? expense.amountCents : 0) -
      allocation(expense.amountCents, expense.ownerBasisPoints)))
  if (!onlyMonth) {
    const settlements = await Settlement.find({ spaceId, date: { $lte: `${until}-31` } }).session(session ?? null)
    total = safeSum([total, ...settlements.map((item) =>
      item.fromUserId.toString() === ownerId ? item.amountCents : -item.amountCents)])
  }
  return total
}

export async function balance(userId: string, spaceId: string, month: string) {
  const space = await memberSpace(spaceId, userId)
  const ownerId = space.createdBy.toString()
  const filter = { spaceId, date: { $gte: `${month}-01`, $lte: `${month}-31` } }
  const expenses = await Expense.find({ ...filter, kind: 'shared' })
  const incomes = await Income.find(filter)
  const settlements = await Settlement.find(filter).sort({ date: -1, createdAt: -1, _id: -1 })
  const sharedCents = safeSum(expenses.map((item) => item.amountCents))
  const dueOwner = safeSum(expenses.map((item) => allocation(item.amountCents, item.ownerBasisPoints)))
  const ownerShare = sharedCents ? Number((BigInt(dueOwner) * 10000n + BigInt(sharedCents) / 2n) / BigInt(sharedCents)) : 5000
  const owner = { contributionCents: dueOwner, shareBasisPoints: ownerShare }
  const partner = { contributionCents: sharedCents - dueOwner, shareBasisPoints: 10000 - ownerShare }
  const incomesCents = safeSum(incomes.map((item) => item.amountCents))
  return {
    month: pending(await debt(spaceId, ownerId, month, undefined, month), ownerId, userId),
    accumulated: pending(await debt(spaceId, ownerId, month), ownerId, userId),
    members: ownerId === userId ? { me: owner, partner } : { me: partner, partner: owner },
    summary: { incomesCents, sharedExpensesCents: sharedCents, remainingCents: incomesCents - sharedCents },
    settlements: settlements.map((item) => ({
      id: item._id.toString(), amountCents: item.amountCents, date: item.date, note: item.note,
      paidBy: item.fromUserId.toString() === userId ? 'me' : 'partner',
    })),
  }
}

export async function settle(userId: string, spaceId: string, input: { amountCents: number; date: string; note: string | null }) {
  const today = new Date().toISOString().slice(0, 10)
  if (input.date > today) throw new ApiError(400, 'future_settlement', 'La liquidación no puede ser futura.')
  return mutateSpace(spaceId, userId, async (space, session) => {
    if (space.members.length !== 2) throw new ApiError(409, 'missing_partner', 'Se necesitan dos miembros.')
    const ownerId = space.createdBy.toString()
    // Validate against the balance at the payment date, never against future expenses.
    const expenses = await Expense.find({ spaceId, kind: 'shared', date: { $lte: input.date } }).session(session)
    const settlements = await Settlement.find({ spaceId, date: { $lte: input.date } }).session(session)
    const current = safeSum([
      ...expenses.map((item) => (item.paidBy.toString() === ownerId ? item.amountCents : 0) -
        allocation(item.amountCents, item.ownerBasisPoints)),
      ...settlements.map((item) => item.fromUserId.toString() === ownerId ? item.amountCents : -item.amountCents),
    ])
    if (current === 0 || input.amountCents > Math.abs(current)) {
      throw new ApiError(409, 'settlement_limit', 'La liquidación supera la deuda pendiente.')
    }
    // Backdating across later payments could invalidate an already registered payment.
    if (await Settlement.exists({ spaceId, date: { $gt: input.date } }).session(session)) {
      throw new ApiError(409, 'settlement_date_conflict', 'La fecha es anterior a otra liquidación registrada.')
    }
    const partner = space.members.find((id) => id.toString() !== ownerId)
    if (!partner) throw new Error('El espacio no tiene pareja.')
    const [item] = await Settlement.create([{
      ...input, spaceId, createdBy: userId,
      fromUserId: current > 0 ? partner : space.createdBy,
      toUserId: current > 0 ? space.createdBy : partner,
    }], { session })
    return item
  })
}
