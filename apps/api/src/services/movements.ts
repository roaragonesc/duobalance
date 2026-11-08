import type { ClientSession } from 'mongoose'
import { Category, Expense, Income, Settlement } from '../models/finance.js'
import { lockCategory, memberSpace, missing, mutateSpace } from '../repositories/finance.js'
import { ApiError } from '../utils/ApiError.js'
import { proportionalBasis, safeSum } from './calculations.js'
import { balance } from './balances.js'

type ExpenseInput = {
  description: string; amountCents: number; date: string; categoryId: string; kind: 'shared' | 'individual'
}
type IncomeInput = { description: string; amountCents: number; date: string }

/** Lista los gastos del mes visibles para el miembro: compartidos y sus propios individuales. */
export async function listExpenses(userId: string, spaceId: string, month: string, kind?: string, categoryId?: string) {
  await memberSpace(spaceId, userId)
  return Expense.find({
    spaceId, date: { $gte: `${month}-01`, $lte: `${month}-31` },
    $or: [{ kind: 'shared' }, { createdBy: userId }],
    ...(kind ? { kind } : {}), ...(categoryId ? { categoryId } : {}),
  }).sort({ date: -1, createdAt: -1, _id: -1 })
}

/** Obtiene un gasto accesible y comprueba la pertenencia al espacio; los privados ajenos devuelven 404. */
export async function getExpense(userId: string, id: string) {
  const expense = await Expense.findOne({ _id: id, $or: [{ kind: 'shared' }, { createdBy: userId }] })
  if (!expense) throw missing()
  await memberSpace(expense.spaceId.toString(), userId)
  return expense
}

/** Calcula el reparto proporcional del creador con los ingresos del mes dentro de la transacción. */
async function basis(spaceId: string, ownerId: string, month: string, session: ClientSession) {
  const incomes = await Income.find({ spaceId, date: { $gte: `${month}-01`, $lte: `${month}-31` } }).session(session)
  const total = safeSum(incomes.map((item) => item.amountCents))
  const owner = safeSum(incomes.filter((item) => item.createdBy.toString() === ownerId).map((item) => item.amountCents))
  return proportionalBasis(owner, total)
}

/**
 * Crea o edita un gasto propio en una transacción y bloquea su categoría.
 * Al crear guarda el reparto histórico; al editar conserva ese reparto y el tipo.
 */
export async function saveExpense(userId: string, spaceId: string, input: ExpenseInput, id?: string) {
  return mutateSpace(spaceId, userId, async (space, session) => {
    await lockCategory(input.categoryId, userId, session)
    if (id) {
      const expense = await Expense.findOne({ _id: id, spaceId, createdBy: userId }).session(session)
      if (!expense) throw missing()
      if (expense.kind !== input.kind) throw new ApiError(400, 'kind_locked', 'No se puede cambiar el tipo del gasto.')
      Object.assign(expense, input)
      await expense.save({ session })
      return expense
    }
    const ownerBasisPoints = space.splitMethod === 'equal' ? 5000 :
      await basis(spaceId, space.createdBy.toString(), input.date.slice(0, 7), session)
    const [expense] = await Expense.create([{
      ...input, spaceId, createdBy: userId, paidBy: userId, ownerBasisPoints,
    }], { session })
    return expense
  })
}

/**
 * Elimina un gasto únicamente si el usuario es su creador.
 * Serializa la operación en el espacio; conserva las liquidaciones y devuelve 404 si no puede borrarlo.
 */
export async function removeExpense(userId: string, id: string) {
  const expense = await getExpense(userId, id)
  return mutateSpace(expense.spaceId.toString(), userId, async (_space, session) => {
    const result = await Expense.deleteOne({ _id: id, createdBy: userId }).session(session)
    if (!result.deletedCount) throw missing()
  })
}

/** Lista los ingresos mensuales de ambos miembros después de verificar el acceso al espacio. */
export async function listIncomes(userId: string, spaceId: string, month: string) {
  await memberSpace(spaceId, userId)
  return Income.find({ spaceId, date: { $gte: `${month}-01`, $lte: `${month}-31` } })
    .sort({ date: -1, createdAt: -1, _id: -1 })
}

/** Obtiene un ingreso para un miembro del espacio; consultarlo no concede permiso de edición. */
export async function getIncome(userId: string, id: string) {
  const income = await Income.findById(id)
  if (!income) throw missing()
  await memberSpace(income.spaceId.toString(), userId)
  return income
}

/** Crea o actualiza un ingreso del usuario en una transacción; nunca modifica ingresos de la pareja. */
export async function saveIncome(userId: string, spaceId: string, input: IncomeInput, id?: string) {
  return mutateSpace(spaceId, userId, async (_space, session) => {
    if (id) {
      const income = await Income.findOneAndUpdate({ _id: id, spaceId, createdBy: userId },
        { $set: input }, { new: true, session, runValidators: true })
      if (!income) throw missing()
      return income
    }
    const [income] = await Income.create([{ ...input, spaceId, createdBy: userId }], { session })
    return income
  })
}

/** Borra solo un ingreso propio con bloqueo del espacio y sin recalcular repartos históricos. */
export async function removeIncome(userId: string, id: string) {
  const income = await getIncome(userId, id)
  return mutateSpace(income.spaceId.toString(), userId, async (_space, session) => {
    const result = await Income.deleteOne({ _id: id, createdBy: userId }).session(session)
    if (!result.deletedCount) throw missing()
  })
}

/** Recupera una liquidación existente después de comprobar la pertenencia al espacio. */
export async function getSettlement(userId: string, id: string) {
  const settlement = await Settlement.findById(id)
  if (!settlement) throw missing()
  await memberSpace(settlement.spaceId.toString(), userId)
  return settlement
}

/** Compone el dashboard mensual con gastos compartidos, categorías, contribuciones y comparación anterior. */
export async function summary(userId: string, spaceId: string, month: string) {
  const list = (await listExpenses(userId, spaceId, month)).filter((item) => item.kind === 'shared')
  const result = await balance(userId, spaceId, month)
  const previousMonth = new Date(`${month}-01T12:00:00Z`)
  previousMonth.setUTCMonth(previousMonth.getUTCMonth() - 1)
  const previous = await listExpenses(userId, spaceId, previousMonth.toISOString().slice(0, 7), 'shared')
  const categories = await Category.find({ _id: { $in: list.map((item) => item.categoryId) } })
  return {
    totalCents: result.summary.sharedExpensesCents,
    previousMonthTotalCents: previous.length ? safeSum(previous.map((item) => item.amountCents)) : null,
    myContributionCents: result.members.me.contributionCents,
    partnerContributionCents: result.members.partner.contributionCents,
    pending: result.month,
    categories: categories.map((item) => ({
      id: item._id.toString(), name: item.name,
      amountCents: safeSum(list.filter((expense) => expense.categoryId.equals(item._id)).map((expense) => expense.amountCents)),
    })),
    recentExpenses: list.slice(0, 3).map((item) => ({
      id: item._id.toString(), categoryId: item.categoryId.toString(),
      description: item.description, amountCents: item.amountCents, date: item.date,
    })),
  }
}
