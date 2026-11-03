import { MongoMemoryReplSet } from 'mongodb-memory-server'
import { database as mongoose } from './backendDatabase'
import { seed } from '../../backend/src/seeds/seed.js'

async function main() {
  const mongo = await MongoMemoryReplSet.create({
    instanceOpts: [{ port: 27018 }],
    replSet: { count: 1, storageEngine: 'wiredTiger' },
    binary: { version: '8.0.17' },
  })
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => { void mongo.stop() })
  }
  if (process.env.SEED_TEST_DATA === '1') {
    const database = process.env.MONGODB_DATABASE
    if (!database || !/^duobalance_test_[a-f0-9]{32}$/.test(database)) throw new Error('Seed E2E bloqueado.')
    await mongoose.connect('mongodb://127.0.0.1:27018', { dbName: database })
    try { await seed('SeedPruebas123!') } finally { await mongoose.disconnect() }
  }
  await import('../../backend/src/server.js')
}

main().catch(() => {
  console.error('No se pudo iniciar el MongoDB aislado de tests.')
  process.exitCode = 1
})
