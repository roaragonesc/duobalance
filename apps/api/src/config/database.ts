import mongoose from 'mongoose'
import type { Environment } from './environment.js'

/** Conecta a la base configurada y exige una topología compatible con las transacciones financieras. */
export async function connectDatabase(env: Environment): Promise<void> {
  mongoose.set('bufferCommands', false)
  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DATABASE, serverSelectionTimeoutMS: 10_000, autoIndex: false,
  })
  const database = mongoose.connection.db
  if (!database) throw new Error('MongoDB no ha abierto la base de datos.')
  const topology: unknown = await database.admin().command({ hello: 1 })
  if (!topology || typeof topology !== 'object' ||
      (!(('setName' in topology) && typeof topology.setName === 'string' && topology.setName.length > 0) &&
      !(('msg' in topology) && topology.msg === 'isdbgrid'))) {
    throw new Error('MongoDB requiere un replica set o un clúster compatible con transacciones.')
  }
}
