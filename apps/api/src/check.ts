import { existsSync } from 'node:fs'
import mongoose from 'mongoose'
import { readEnvironment } from './config/environment.js'
import { connectDatabase } from './config/database.js'
import { Category } from './models/finance.js'

/** Diagnostica conexión y categorías globales en desarrollo sin escribir documentos ni revelar la URI. */
async function main(): Promise<void> {
  if (!existsSync('.env')) throw new Error('Falta apps/api/.env. Guarda la conexión privada de desarrollo.')
  const env = readEnvironment()
  if (env.NODE_ENV !== 'development') throw new Error('Esta comprobación solo admite desarrollo.')
  await connectDatabase(env)
  console.info('PASS: conexión MongoDB y soporte de transacciones.')
  const required = ['food', 'housing', 'utilities', 'transport', 'leisure', 'health', 'other']
  const keys: string[] = await Category.find({ ownerId: null, key: { $in: required } }).distinct('key')
  if (required.some((key) => !keys.includes(key))) {
    throw new Error('Faltan categorías globales. Ejecuta pnpm run backend:seed en la base de desarrollo.')
  }
  console.info('PASS: las siete categorías globales están preparadas. No se han escrito datos.')
}

main().catch((error: unknown) => {
  const message = error instanceof Error &&
    ['Falta apps/api/.env', 'Esta comprobación', 'Faltan categorías', 'MongoDB requiere', 'Configuración inválida:']
      .some((prefix) => error.message.startsWith(prefix))
    ? error.message : 'Revisa configuración, permisos, IP autorizada y conectividad; no se muestran datos de conexión.'
  console.error(`BLOCKED: ${message}`)
  process.exitCode = 1
}).finally(() => mongoose.disconnect())
