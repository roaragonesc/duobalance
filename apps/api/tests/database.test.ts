import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import mongoose from 'mongoose'
import { connectDatabase } from '../src/config/database.js'
import type { Environment } from '../src/config/environment.js'

const env: Environment = {
  NODE_ENV: 'development', HOST: '127.0.0.1', PORT: 3001,
  FRONTEND_ORIGIN: 'http://localhost:5173', MONGODB_URI: 'mongodb://127.0.0.1:27017',
  MONGODB_DATABASE: 'duobalance_dev', MAIL_DIRECTORY: '.local-mail',
}

function setup(t: TestContext, topology: unknown) {
  const calls: { uri: string; options?: mongoose.ConnectOptions }[] = []
  const descriptor = Object.getOwnPropertyDescriptor(mongoose.connection, 'db')
  t.mock.method(mongoose, 'set', () => mongoose)
  t.mock.method(mongoose, 'connect', async (uri: string, options?: mongoose.ConnectOptions) => {
    calls.push({ uri, options })
    return mongoose
  })
  Object.defineProperty(mongoose.connection, 'db', { configurable: true, value: {
    admin: () => ({ command: async (command: object) => {
      assert.deepEqual(command, { hello: 1 })
      return topology
    } }),
  } })
  t.after(() => {
    t.mock.restoreAll()
    if (descriptor) Object.defineProperty(mongoose.connection, 'db', descriptor)
    else Reflect.deleteProperty(mongoose.connection, 'db')
  })
  return calls
}

test('connects to the configured isolated database and verifies replica-set support', async (t) => {
  const calls = setup(t, { setName: 'rs0' })
  await connectDatabase(env)
  assert.deepEqual(calls, [{ uri: env.MONGODB_URI, options: {
    dbName: 'duobalance_dev', serverSelectionTimeoutMS: 10_000, autoIndex: false,
  } }])
})

test('accepts a transaction-compatible sharded cluster', async (t) => {
  setup(t, { msg: 'isdbgrid' })
  await connectDatabase(env)
})

test('rejects standalone MongoDB before starting the application', async (t) => {
  setup(t, { isWritablePrimary: true })
  await assert.rejects(connectDatabase(env), /requiere un replica set/)
})

for (const [name, topology] of [
  ['null', null], ['empty replica-set name', { setName: '' }], ['invalid replica-set name', { setName: 123 }],
] as const) {
  test(`rejects malformed topology: ${name}`, async (t) => {
    setup(t, topology)
    await assert.rejects(connectDatabase(env), /requiere un replica set/)
  })
}

test('does not hide connection failures with a successful fallback', async (t) => {
  setup(t, { setName: 'rs0' })
  t.mock.method(mongoose, 'connect', async () => { throw new Error('Connection unavailable') })
  await assert.rejects(connectDatabase(env), /Connection unavailable/)
})
