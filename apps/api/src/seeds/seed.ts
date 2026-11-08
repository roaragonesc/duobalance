import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { argon2id, hash } from 'argon2'
import mongoose from 'mongoose'
import { z } from 'zod'
import { User } from '../models/User.js'
import { Category, Space, Expense, Income, Settlement, financeModels } from '../models/finance.js'

const sourceSchema = z.object({
  users: z.array(z.object({ key: z.string(), email: z.email(), name: z.string(), description: z.string() })),
  expenses: z.array(z.object({
    description: z.string(), amountCents: z.number().int().positive(),
    categoryId: z.string(), kind: z.enum(['shared', 'individual']), by: z.enum(['A', 'B']),
  })),
  incomes: z.array(z.object({ description: z.string(), amountCents: z.number().int().positive(), by: z.enum(['A', 'B']) })),
  categories: z.array(z.object({ key: z.string(), name: z.string(), icon: z.string(), color: z.string() })),
})
const objectId = (key: string) => new mongoose.Types.ObjectId(createHash('sha256').update(`duobalance-demo-v1:${key}`).digest('hex').slice(0, 24))

export async function seed(password: string) {
  if (!/^(development|test)$/.test(process.env.NODE_ENV ?? 'development') ||
      !/^duobalance_(?:dev|test)(?:_[a-z0-9]+)?$/.test(mongoose.connection.name)) {
    throw new Error('Seed bloqueado fuera de una base de desarrollo/test.')
  }
  if (password.length < 8 || !/\p{Lu}/u.test(password) || !/\p{Ll}/u.test(password) || !/\d/.test(password)) {
    throw new Error('SEED_PASSWORD debe cumplir la política de contraseña.')
  }
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
  const data = sourceSchema.parse(JSON.parse(await readFile(resolve(root, 'shared/mockData.json'), 'utf8')))
  await User.createIndexes()
  for (const model of financeModels) await model.createIndexes()
  const passwordHash = await hash(password, { type: argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 })
  const timestamps = { createdAt: new Date(), updatedAt: new Date() }
  await mongoose.connection.transaction(async (session) => {
    for (const user of data.users) {
      const existing = await User.findOne({ email: user.email }).session(session)
      if (existing && !existing._id.equals(objectId(`user:${user.key}`))) {
        throw new Error('Seed bloqueado: una cuenta existente no pertenece a este seed.')
      }
      await User.updateOne({ _id: objectId(`user:${user.key}`) }, { $setOnInsert: {
        ...timestamps,
        name: user.name, email: user.email, passwordHash, confirmed: true, authVersion: 0,
      } }, { upsert: true, session, timestamps: false })
    }
    for (const category of data.categories) {
      const existing = await Category.findOne({ key: category.key }).session(session)
      if (existing && !existing._id.equals(objectId(`category:${category.key}`))) {
        throw new Error('Seed bloqueado: categoría global existente no gestionada por el seed.')
      }
      await Category.updateOne({ _id: objectId(`category:${category.key}`) }, { $setOnInsert: {
        ...timestamps, ...category, ownerId: null, seedKey: `category:${category.key}`,
      } }, { upsert: true, session, timestamps: false })
    }
    const owner = objectId('user:rocio')
    const partner = objectId('user:pablo')
    const solo = objectId('user:solo')
    for (const item of [
      { key: 'casa', name: 'Casa', createdBy: owner, members: [owner, partner] },
      { key: 'solo', name: 'Piso Centro', createdBy: solo, members: [solo] },
    ]) {
      await Space.updateOne({ _id: objectId(`space:${item.key}`) }, { $setOnInsert: {
        ...timestamps,
        name: item.name, createdBy: item.createdBy, members: item.members,
        splitMethod: 'equal', seedKey: `space:${item.key}`,
      } }, { upsert: true, session, timestamps: false })
    }
    const today = new Date().toISOString().slice(0, 10)
    const current = new Date(`${today.slice(0, 7)}-01T12:00:00Z`)
    const previous = new Date(current)
    previous.setUTCMonth(previous.getUTCMonth() - 1)
    const months = [current, previous].map((value) => value.toISOString().slice(0, 7))
    const day = (month: string, index: number) => {
      const date = `${month}-${String(Math.max(1, 28 - index * 4)).padStart(2, '0')}`
      return date > today ? today : date
    }
    for (const month of months) {
      for (const [index, item] of data.expenses.entries()) {
        const key = `expense:${month}:${index}`
        const payer = item.by === 'A' ? owner : partner
        await Expense.updateOne({ seedKey: key }, { $setOnInsert: {
          ...timestamps,
          _id: objectId(key), seedKey: key, spaceId: objectId('space:casa'),
          description: item.description, amountCents: item.amountCents,
          categoryId: objectId(`category:${item.categoryId}`), kind: item.kind,
          createdBy: payer, paidBy: payer, date: day(month, index), ownerBasisPoints: 5000,
        } }, { upsert: true, session, timestamps: false })
      }
      for (const [index, item] of data.incomes.entries()) {
        const key = `income:${month}:${index}`
        await Income.updateOne({ seedKey: key }, { $setOnInsert: {
          ...timestamps,
          _id: objectId(key), seedKey: key, spaceId: objectId('space:casa'),
          description: item.description, amountCents: item.amountCents,
          createdBy: item.by === 'A' ? owner : partner, date: day(month, index),
        } }, { upsert: true, session, timestamps: false })
      }
    }
    // Historical illustrative payment from the mock; do not revalidate against today's debt.
    await Settlement.updateOne({ seedKey: 'settlement:set-0' }, { $setOnInsert: {
      ...timestamps,
      _id: objectId('settlement:set-0'), seedKey: 'settlement:set-0', spaceId: objectId('space:casa'),
      fromUserId: owner, toUserId: partner, createdBy: owner,
      date: day(months[1], 0), amountCents: 10000, note: 'Bizum del mes',
    } }, { upsert: true, session, timestamps: false })
  })
  // Invitations are empty in the original seed: indexes create the collection, no fake invitation.
  const counts: Record<string, number> = { users: await User.countDocuments() }
  for (const model of financeModels) counts[model.collection.collectionName] = await model.countDocuments()
  return counts
}
