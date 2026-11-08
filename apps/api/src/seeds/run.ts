import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseEnv } from 'node:util'
import mongoose from 'mongoose'
import { readEnvironment } from '../config/environment.js'
import { seed } from './seed.js'

async function main() {
  const file = resolve('.env')
  if (!existsSync(file)) {
    console.error('Falta apps/api/.env en disco. No se ha intentado conectar a MongoDB.')
    process.exitCode = 1
    return
  }
  // This command is launched from apps/api/; no root .env.local is loaded.
  const fileEnvironment = parseEnv(readFileSync(file, 'utf8'))
  if (!fileEnvironment.MONGODB_URI?.trim()) throw new Error('Falta MONGODB_URI en apps/api/.env.')
  Object.assign(process.env, fileEnvironment)
  const env = readEnvironment()
  if (env.MONGODB_URI.startsWith('mongodb+srv:')) {
    const uri = new URL(env.MONGODB_URI)
    if (!uri.username || !uri.password) throw new Error('Faltan credenciales Atlas en apps/api/.env.')
  }
  if (env.NODE_ENV !== 'development') throw new Error('Este comando solo permite desarrollo.')
  if (!process.env.SEED_PASSWORD) throw new Error('Falta SEED_PASSWORD en apps/api/.env.')
  mongoose.set('bufferCommands', false)
  await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DATABASE, serverSelectionTimeoutMS: 15000, autoIndex: false })
  console.info('Conexión de desarrollo verificada.')
  const counts = await seed(process.env.SEED_PASSWORD)
  console.info('Colecciones y cantidades verificadas:', counts)
}

main().catch(() => {
  console.error('No se pudo completar el seed. Revisa apps/api/.env, acceso a MongoDB y conflictos de datos. No se muestran credenciales.')
  process.exitCode = 1
}).finally(() => mongoose.disconnect())
