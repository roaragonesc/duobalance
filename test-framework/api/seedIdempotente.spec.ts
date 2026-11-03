import { database as mongoose } from '../integration/backendDatabase'
import { test, expect } from '../fixtures/api'
import { seed } from '../../backend/src/seeds/seed.js'
import { User } from '../../backend/src/models/User.js'

test('TC58_API_seedIdempotente', async () => {
  const database = process.env.DUOBALANCE_API_TEST_DATABASE
  if (!database || !/^duobalance_test_[a-f0-9]{32}$/.test(database)) throw new Error('Base seed de test no válida.')
  const previous = process.env.NODE_ENV
  process.env.NODE_ENV = 'test'
  try {
    await mongoose.connect('mongodb://127.0.0.1:27018', { dbName: database })
    const first = await seed('SeedPruebas123!')
    const before = await User.findOne({ email: 'rocio@duobalance.test' }).select('+passwordHash').lean()
    const second = await seed('SeedPruebas123!')
    expect(second).toEqual(first)
    const after = await User.findOne({ email: 'rocio@duobalance.test' }).select('+passwordHash').lean()
    expect(after).toEqual(before)
    const seededCounts: Record<string, number> = {}
    for (const name of ['spaces', 'expenses', 'incomes', 'categories', 'settlements']) {
      seededCounts[name] = await mongoose.connection.collection(name).countDocuments({ seedKey: { $exists: true } })
    }
    expect(seededCounts).toEqual({ spaces: 2, expenses: 14, incomes: 6, categories: 7, settlements: 1 })
    const collections = await mongoose.connection.db?.listCollections({}, { nameOnly: true }).toArray()
    expect(collections?.map((item) => item.name)).toEqual(expect.arrayContaining([
      'users', 'spaces', 'expenses', 'incomes', 'categories', 'invitations', 'settlements',
    ]))
    const users = await User.find({ email: { $in: [
      'nuevo@duobalance.test', 'solo@duobalance.test', 'rocio@duobalance.test',
      'pablo@duobalance.test', 'ines@duobalance.test', 'mateo@duobalance.test',
    ] } }).select('+passwordHash')
    expect(users.map((item) => item.name).sort()).toEqual(['Curro', 'Isabel', 'Juan', 'Maria', 'Pablo', 'Rocío'].sort())
    for (const user of users) expect(user.passwordHash).toMatch(/^\$argon2id\$/)
  } finally {
    await mongoose.disconnect()
    if (previous === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previous
  }
})
