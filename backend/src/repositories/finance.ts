import mongoose, { type ClientSession } from 'mongoose'
import { Space, Category } from '../models/finance.js'
import { ApiError } from '../utils/ApiError.js'

export const missing = () => new ApiError(404, 'not_found', 'No se ha encontrado el recurso.')

export async function memberSpace(spaceId: string, userId: string, session?: ClientSession) {
  const space = await Space.findOne({ _id: spaceId, members: userId }).session(session ?? null)
  if (!space) throw missing()
  return space
}

// All space mutations write the same document, serializing debt/membership checks.
export async function mutateSpace<T>(
  spaceId: string, userId: string,
  operation: (space: Awaited<ReturnType<typeof memberSpace>>, session: ClientSession) => Promise<T>,
): Promise<T> {
  return mongoose.connection.transaction(async (session) => {
    const space = await Space.findOneAndUpdate({ _id: spaceId, members: userId },
      { $inc: { revision: 1 } }, { new: true, session })
    if (!space) throw missing()
    return operation(space, session)
  })
}

export async function lockCategory(categoryId: string, userId: string, session: ClientSession) {
  // A write lock prevents deletion racing an expense referencing this category.
  const category = await Category.findOneAndUpdate({
    _id: categoryId, $or: [{ ownerId: null }, { ownerId: userId }],
  }, { $set: { updatedAt: new Date() } }, { new: true, session })
  if (!category) throw missing()
  return category
}

export function ownerOnly(space: { createdBy: { toString(): string } }, userId: string) {
  if (space.createdBy.toString() !== userId) {
    throw new ApiError(403, 'not_space_owner', 'Solo el creador puede gestionar el espacio.')
  }
}
