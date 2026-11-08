import type { Request, RequestHandler } from 'express'
import { z } from 'zod'
import { currentSession } from '../middlewares/session.js'
import { Space, Settlement } from '../models/finance.js'
import * as schema from '../validators/finance.js'
import * as spaces from '../services/spaces.js'
import * as categories from '../services/categories.js'
import * as movements from '../services/movements.js'
import * as balances from '../services/balances.js'
import { memberSpace } from '../repositories/finance.js'
import { safeSum } from '../services/calculations.js'

const user = (request: Request) => currentSession(request).userId
const id = (request: Request, key = 'id') => schema.id.parse(request.params[key])
const month = (request: Request) => schema.monthQuery.parse(request.query).month

export const listSpaces: RequestHandler = async (request, response) => {
  response.json({ spaces: await Space.find({ members: user(request) }) })
}
export const createSpace: RequestHandler = async (request, response) => {
  response.status(201).json({ space: await spaces.createSpace(user(request), schema.createSpace.parse(request.body)) })
}
export const getSpace: RequestHandler = async (request, response) => {
  response.json({ space: await spaces.getSpace(user(request), id(request)) })
}
export const updateSpace: RequestHandler = async (request, response) => {
  response.json({ space: await spaces.updateSpace(user(request), id(request), schema.updateSpace.parse(request.body)) })
}
export const deleteSpace: RequestHandler = async (request, response) => {
  await spaces.deleteSpace(user(request), id(request))
  response.sendStatus(204)
}
export const members: RequestHandler = async (request, response) => {
  response.json({ members: await spaces.members(user(request), id(request)) })
}
export const invite: RequestHandler = async (request, response) => {
  response.status(201).json(await spaces.invite(user(request), id(request), schema.invite.parse(request.body).email))
}
export const invitations: RequestHandler = async (request, response) => {
  response.json({ invitations: await spaces.listInvitations(user(request)) })
}
export function respond(accept: boolean): RequestHandler {
  return async (request, response) => {
    const value = z.string().regex(/^[a-f0-9]{64}$/).parse(request.params.token)
    response.json(await spaces.respond(user(request), value, accept))
  }
}
export const listCategories: RequestHandler = async (request, response) => {
  response.json({ categories: await categories.list(user(request)) })
}
export const createCategory: RequestHandler = async (request, response) => {
  response.status(201).json({ category: await categories.create(user(request), schema.category.parse(request.body)) })
}
export const updateCategory: RequestHandler = async (request, response) => {
  response.json({ category: await categories.update(user(request), id(request), schema.category.parse(request.body)) })
}
export const deleteCategory: RequestHandler = async (request, response) => {
  await categories.remove(user(request), id(request))
  response.sendStatus(204)
}
export const expenses: RequestHandler = async (request, response) => {
  const query = schema.listQuery.parse(request.params.id ? { ...request.query, spaceId: request.params.id } : request.query)
  const expenses = await movements.listExpenses(user(request), query.spaceId, query.month, query.kind, query.categoryId)
  const list = expenses.map((item) => ({
    id: item._id.toString(), spaceId: item.spaceId.toString(), description: item.description,
    amountCents: item.amountCents, date: item.date, categoryId: item.categoryId.toString(), kind: item.kind,
    paidBy: item.paidBy.toString() === user(request) ? 'me' : 'partner',
    canEdit: item.createdBy.toString() === user(request),
  }))
  const balance = await balances.balance(user(request), query.spaceId, query.month)
  const sharedCents = safeSum(list.filter((item) => item.kind === 'shared').map((item) => item.amountCents))
  response.json({ expenses: list, totalCents: safeSum(list.map((item) => item.amountCents)),
    sharedCents, individualCents: safeSum(list.filter((item) => item.kind === 'individual').map((item) => item.amountCents)),
    pending: balance.month })
}
export const getExpense: RequestHandler = async (request, response) => {
  response.json({ expense: await movements.getExpense(user(request), id(request)) })
}
export const createExpense: RequestHandler = async (request, response) => {
  const { spaceId, ...input } = schema.expense.extend({ spaceId: schema.id }).parse(request.body)
  response.status(201).json({ expense: await movements.saveExpense(user(request), spaceId, input) })
}
export const updateExpense: RequestHandler = async (request, response) => {
  const expense = await movements.getExpense(user(request), id(request))
  response.json({ expense: await movements.saveExpense(user(request), expense.spaceId.toString(), schema.expense.parse(request.body), id(request)) })
}
export const deleteExpense: RequestHandler = async (request, response) => {
  await movements.removeExpense(user(request), id(request))
  response.sendStatus(204)
}
export const incomes: RequestHandler = async (request, response) => {
  const query = schema.listQuery.pick({ spaceId: true, month: true }).parse(
    request.params.id ? { ...request.query, spaceId: request.params.id } : request.query)
  const list = await movements.listIncomes(user(request), query.spaceId, query.month)
  const myCents = safeSum(list.filter((item) => item.createdBy.toString() === user(request)).map((item) => item.amountCents))
  response.json({ incomes: list.map((item) => ({
    id: item._id.toString(), description: item.description, date: item.date, amountCents: item.amountCents,
    owner: item.createdBy.toString() === user(request) ? 'me' : 'partner',
  })), totalCents: safeSum(list.map((item) => item.amountCents)), myCents,
  partnerCents: safeSum(list.filter((item) => item.createdBy.toString() !== user(request)).map((item) => item.amountCents)) })
}
export const getIncome: RequestHandler = async (request, response) => {
  response.json({ income: await movements.getIncome(user(request), id(request)) })
}
export const createIncome: RequestHandler = async (request, response) => {
  const { spaceId, ...input } = schema.income.extend({ spaceId: schema.id }).parse(request.body)
  response.status(201).json({ income: await movements.saveIncome(user(request), spaceId, input) })
}
export const updateIncome: RequestHandler = async (request, response) => {
  const income = await movements.getIncome(user(request), id(request))
  response.json({ income: await movements.saveIncome(user(request), income.spaceId.toString(), schema.income.parse(request.body), id(request)) })
}
export const deleteIncome: RequestHandler = async (request, response) => {
  await movements.removeIncome(user(request), id(request))
  response.sendStatus(204)
}
export const balance: RequestHandler = async (request, response) => {
  response.json(await balances.balance(user(request), id(request), month(request)))
}
export const summary: RequestHandler = async (request, response) => {
  response.json(await movements.summary(user(request), id(request), month(request)))
}
export const settlements: RequestHandler = async (request, response) => {
  await memberSpace(id(request), user(request))
  response.json({ settlements: await Settlement.find({ spaceId: id(request) }).sort({ date: -1, createdAt: -1 }) })
}
export const getSettlement: RequestHandler = async (request, response) => {
  response.json({ settlement: await movements.getSettlement(user(request), id(request)) })
}
export const createSettlement: RequestHandler = async (request, response) => {
  response.status(201).json({ settlement: await balances.settle(user(request), id(request), schema.settlement.parse(request.body)) })
}
