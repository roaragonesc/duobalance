import mongoose from 'mongoose'
import { Category, Expense } from '../models/finance.js'
import { missing } from '../repositories/finance.js'
import { ApiError } from '../utils/ApiError.js'

type Input = { name: string; icon: string; color: string }

export function list(userId: string) {
  return Category.find({ $or: [{ ownerId: null }, { ownerId: userId }] }).sort({ name: 1 })
}

export function create(userId: string, input: Input) {
  return Category.create({ ...input, ownerId: userId })
}

export function update(userId: string, id: string, input: Input) {
  return mongoose.connection.transaction(async (session) => {
    const category = await Category.findOneAndUpdate({ _id: id, ownerId: userId },
      { $set: input }, { new: true, session, runValidators: true })
    if (!category) throw missing()
    return category
  })
}

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
