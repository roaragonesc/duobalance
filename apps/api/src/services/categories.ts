import mongoose from 'mongoose'
import { Category, Expense } from '../models/finance.js'
import { missing } from '../repositories/finance.js'
import { ApiError } from '../utils/ApiError.js'

type Input = { name: string; icon: string; color: string }

/** Consulta categorías globales y personales del usuario, ordenadas por nombre. */
export function list(userId: string) {
  return Category.find({ $or: [{ ownerId: null }, { ownerId: userId }] }).sort({ name: 1 })
}

/** Crea una categoría personal asignando su propietario desde la sesión. */
export function create(userId: string, input: Input) {
  return Category.create({ ...input, ownerId: userId })
}

/** Edita una categoría personal propia; no permite modificar categorías globales o ajenas. */
export function update(userId: string, id: string, input: Input) {
  return mongoose.connection.transaction(async (session) => {
    const category = await Category.findOneAndUpdate({ _id: id, ownerId: userId },
      { $set: input }, { new: true, session, runValidators: true })
    if (!category) throw missing()
    return category
  })
}

/** Borra una categoría propia solo si no tiene gastos, bloqueando la carrera con nuevas referencias. */
export function remove(userId: string, id: string) {
  return mongoose.connection.transaction(async (session) => {
    const category = await Category.findOneAndUpdate({ _id: id, ownerId: userId },
      { $set: { updatedAt: new Date() } }, { new: true, session })
    if (!category) throw missing()
    if (await Expense.exists({ categoryId: id }).session(session)) {
      throw new ApiError(409, 'category_in_use', 'La categoría tiene gastos asociados.')
    }
    await Category.deleteOne({ _id: id, ownerId: userId }).session(session)
  })
}
