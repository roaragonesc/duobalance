import mongoose from 'mongoose'
import { createApp } from './app.js'
import { readEnvironment } from './config/environment.js'
import { developmentMailer } from './services/mail.js'
import { createDummyHash } from './services/authentication.js'
import { User } from './models/User.js'
import { Session } from './models/Session.js'
import { financeModels } from './models/finance.js'

async function main() {
  const env = readEnvironment()
  mongoose.set('bufferCommands', false)
  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DATABASE, serverSelectionTimeoutMS: 10_000, autoIndex: false,
  })
  await Promise.all([User.createIndexes(), Session.createIndexes()])
  for (const model of financeModels) await model.createIndexes()
  const app = createApp(env, developmentMailer(env), await createDummyHash())
  const server = app.listen(env.PORT, env.HOST, () => {
    console.info(`Backend DuoBalance preparado en ${env.HOST}:${env.PORT}.`)
  })
  server.on('error', () => {
    console.error('No se ha podido iniciar el servidor HTTP.')
    void mongoose.disconnect().finally(() => { process.exitCode = 1 })
  })
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      const deadline = setTimeout(() => { process.exit(1) }, 10_000)
      deadline.unref()
      server.close(() => {
        void mongoose.disconnect().finally(() => { clearTimeout(deadline) })
      })
    })
  }
}

main().catch((error: unknown) => {
  console.error('No se ha podido iniciar el backend.',
    error instanceof Error && error.message.startsWith('Configuración inválida:') ? error.message :
      'Revisa la configuración, la conectividad y los permisos de MongoDB; no se muestran datos de conexión.')
  void mongoose.disconnect().finally(() => { process.exitCode = 1 })
})
