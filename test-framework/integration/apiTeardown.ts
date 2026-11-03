import mongoose from 'mongoose'

export default async function teardown() {
  const database = process.env.DUOBALANCE_API_TEST_DATABASE
  if (!database || !/^duobalance_test_[a-f0-9]{32}$/.test(database)) {
    throw new Error('Limpieza bloqueada: falta la base de datos aleatoria de esta ejecución.')
  }
  const connection = await mongoose.createConnection('mongodb://127.0.0.1:27018', {
    dbName: database, serverSelectionTimeoutMS: 10_000,
  }).asPromise()
  try {
    await connection.dropDatabase()
  } finally {
    await connection.close()
  }
}
