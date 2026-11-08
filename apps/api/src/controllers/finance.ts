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

/** Extrae el usuario autenticado, nunca un identificador enviado por el cliente. */
const user = (request: Request) => currentSession(request).userId
/** Valida el ObjectId de un parámetro de ruta antes de consultar persistencia. */
const id = (request: Request, key = 'id') => schema.id.parse(request.params[key])
/** Valida el mes de consulta con formato YYYY-MM. */
const month = (request: Request) => schema.monthQuery.parse(request.query).month

/** GET /spaces: devuelve únicamente espacios a los que pertenece el usuario. */
export const listSpaces: RequestHandler = async (request, response) => {
  response.json({ spaces: await Space.find({ members: user(request) }) })
}
/** POST /spaces: valida la entrada y devuelve el espacio creado con estado 201. */
export const createSpace: RequestHandler = async (request, response) => {
  response.status(201).json({ space: await spaces.createSpace(user(request), schema.createSpace.parse(request.body)) })
}
/** GET /spaces/:id: devuelve un espacio tras verificar la pertenencia. */
export const getSpace: RequestHandler = async (request, response) => {
  response.json({ space: await spaces.getSpace(user(request), id(request)) })
}
/** PATCH /spaces/:id: valida nombre/reparto y delega la autorización del creador. */
export const updateSpace: RequestHandler = async (request, response) => {
  response.json({ space: await spaces.updateSpace(user(request), id(request), schema.updateSpace.parse(request.body)) })
}
/** DELETE /spaces/:id: borra un espacio sin historial autorizado y responde sin contenido. */
export const deleteSpace: RequestHandler = async (request, response) => {
  await spaces.deleteSpace(user(request), id(request))
  response.sendStatus(204)
}
/** GET /spaces/:id/members: devuelve perfiles limitados de los miembros del espacio. */
export const members: RequestHandler = async (request, response) => {
  response.json({ members: await spaces.members(user(request), id(request)) })
}
/** POST /spaces/:id/invitations: valida el correo y entrega la invitación con su token de un uso. */
export const invite: RequestHandler = async (request, response) => {
  response.status(201).json(await spaces.invite(user(request), id(request), schema.invite.parse(request.body).email))
}
/** GET /invitations: devuelve las invitaciones que el usuario puede consultar. */
export const invitations: RequestHandler = async (request, response) => {
  response.json({ invitations: await spaces.listInvitations(user(request)) })
}
/** Construye el handler de aceptación o rechazo, validando el token y delegando su consumo atómico. */
export function respond(accept: boolean): RequestHandler {
  return async (request, response) => {
    const value = z.string().regex(/^[a-f0-9]{64}$/).parse(request.params.token)
    response.json(await spaces.respond(user(request), value, accept))
  }
}
/** GET /categories: devuelve categorías globales y personales del usuario. */
export const listCategories: RequestHandler = async (request, response) => {
  response.json({ categories: await categories.list(user(request)) })
}
/** POST /categories: valida y crea una categoría personal con estado 201. */
export const createCategory: RequestHandler = async (request, response) => {
  response.status(201).json({ category: await categories.create(user(request), schema.category.parse(request.body)) })
}
/** PATCH /categories/:id: valida los campos y solicita editar una categoría propia. */
export const updateCategory: RequestHandler = async (request, response) => {
  response.json({ category: await categories.update(user(request), id(request), schema.category.parse(request.body)) })
}
/** DELETE /categories/:id: elimina una categoría propia sin gastos y responde 204. */
export const deleteCategory: RequestHandler = async (request, response) => {
  await categories.remove(user(request), id(request))
  response.sendStatus(204)
}
/** GET de gastos mensuales: valida filtros y adapta movimientos, permisos, totales y deuda al frontend. */
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
/** GET /expenses/:id: devuelve el documento de un gasto visible para el usuario. */
export const getExpense: RequestHandler = async (request, response) => {
  response.json({ expense: await movements.getExpense(user(request), id(request)) })
}
/** POST /expenses: valida espacio y movimiento; el servicio deriva creador, pagador y reparto histórico. */
export const createExpense: RequestHandler = async (request, response) => {
  const { spaceId, ...input } = schema.expense.extend({ spaceId: schema.id }).parse(request.body)
  response.status(201).json({ expense: await movements.saveExpense(user(request), spaceId, input) })
}
/** PATCH /expenses/:id: deriva el espacio del gasto existente y delega la edición del creador. */
export const updateExpense: RequestHandler = async (request, response) => {
  const expense = await movements.getExpense(user(request), id(request))
  response.json({ expense: await movements.saveExpense(user(request), expense.spaceId.toString(), schema.expense.parse(request.body), id(request)) })
}
/** DELETE /expenses/:id: solicita el borrado exclusivo del creador y devuelve 204. */
export const deleteExpense: RequestHandler = async (request, response) => {
  await movements.removeExpense(user(request), id(request))
  response.sendStatus(204)
}
/** GET de ingresos mensuales: adapta propietario relativo y totales de ambos miembros. */
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
/** GET /incomes/:id: devuelve un ingreso consultable por un miembro del espacio. */
export const getIncome: RequestHandler = async (request, response) => {
  response.json({ income: await movements.getIncome(user(request), id(request)) })
}
/** POST /incomes: valida los datos y crea un ingreso del usuario con estado 201. */
export const createIncome: RequestHandler = async (request, response) => {
  const { spaceId, ...input } = schema.income.extend({ spaceId: schema.id }).parse(request.body)
  response.status(201).json({ income: await movements.saveIncome(user(request), spaceId, input) })
}
/** PATCH /incomes/:id: deriva el espacio del ingreso y delega la edición exclusiva de su propietario. */
export const updateIncome: RequestHandler = async (request, response) => {
  const income = await movements.getIncome(user(request), id(request))
  response.json({ income: await movements.saveIncome(user(request), income.spaceId.toString(), schema.income.parse(request.body), id(request)) })
}
/** DELETE /incomes/:id: elimina un ingreso propio y responde sin contenido. */
export const deleteIncome: RequestHandler = async (request, response) => {
  await movements.removeIncome(user(request), id(request))
  response.sendStatus(204)
}
/** GET /spaces/:id/balance: devuelve contribuciones, deuda mensual/acumulada e historial del mes validado. */
export const balance: RequestHandler = async (request, response) => {
  response.json(await balances.balance(user(request), id(request), month(request)))
}
/** GET /spaces/:id/summary: devuelve el resumen del dashboard con gastos compartidos y categorías. */
export const summary: RequestHandler = async (request, response) => {
  response.json(await movements.summary(user(request), id(request), month(request)))
}
/** GET /spaces/:id/settlements: verifica pertenencia y devuelve el historial ordenado de pagos. */
export const settlements: RequestHandler = async (request, response) => {
  await memberSpace(id(request), user(request))
  response.json({ settlements: await Settlement.find({ spaceId: id(request) }).sort({ date: -1, createdAt: -1 }) })
}
/** GET /settlements/:id: devuelve una liquidación solo a un miembro de su espacio. */
export const getSettlement: RequestHandler = async (request, response) => {
  response.json({ settlement: await movements.getSettlement(user(request), id(request)) })
}
/** POST /spaces/:id/settlements: valida el pago y delega el límite transaccional de deuda antes de devolver 201. */
export const createSettlement: RequestHandler = async (request, response) => {
  response.status(201).json({ settlement: await balances.settle(user(request), id(request), schema.settlement.parse(request.body)) })
}
