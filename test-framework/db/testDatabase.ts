import { randomUUID } from 'node:crypto'
import pg from 'pg'

const TEMPLATE_DB = 'duobalance_template'

export type TestDatabase = {
  /** Superuser pool: plays the role of migrations, Auth and the SQL Editor. */
  admin: pg.Pool
  /** Dedicated connection, needed to hold a transaction open in concurrency tests. */
  connect: () => Promise<pg.PoolClient>
  drop: () => Promise<void>
}

function config(database: string): pg.PoolConfig {
  const port = Number(process.env.DUOBALANCE_PG_TEST_PORT)
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PostgreSQL test port missing; run with playwright.db.config.ts')
  }
  return {
    host: '127.0.0.1',
    port,
    user: 'postgres',
    password: 'postgres',
    database,
  }
}

// Every test gets a fresh copy of the migrated template database.
export async function createTestDatabase(): Promise<TestDatabase> {
  const name = `test_${randomUUID().replaceAll('-', '')}`
  const root = new pg.Client(config('postgres'))
  await root.connect()
  try {
    for (let attempt = 0; ; attempt++) {
      try {
        await root.query(`create database ${name} template ${TEMPLATE_DB}`)
        break
      } catch (error) {
        // 55006: another test is cloning the template at the same moment.
        if ((error as { code?: string }).code !== '55006' || attempt > 20) throw error
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    }
  } finally {
    await root.end()
  }

  const admin = new pg.Pool({ ...config(name), max: 6 })
  return {
    admin,
    connect: () => admin.connect(),
    drop: async () => {
      await admin.end()
      const client = new pg.Client(config('postgres'))
      try {
        await client.connect()
        await client.query(`drop database if exists ${name} with (force)`)
      } finally {
        await client.end()
      }
    },
  }
}

export async function createUser(
  db: TestDatabase,
  email: string | null,
  { confirmed = true }: { confirmed?: boolean } = {},
): Promise<string> {
  const { rows } = await db.admin.query<{ id: string }>(
    `insert into auth.users (email, email_confirmed_at)
     values ($1, case when $2 then now() end) returning id`,
    [email, confirmed],
  )
  return rows[0].id
}

export type Tx = pg.PoolClient

/** Opens a transaction on client acting like PostgREST: anon or authenticated + JWT sub. */
export async function beginAs(client: Tx, userId: string | null) {
  await client.query('begin')
  await client.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify(userId ? { sub: userId, role: 'authenticated' } : { role: 'anon' }),
  ])
  await client.query(`set local role ${userId ? 'authenticated' : 'anon'}`)
}

/** Runs fn in its own transaction as the given user; commits on success. */
export async function asUser<T>(
  db: TestDatabase,
  userId: string | null,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  const client = await db.connect()
  try {
    await beginAs(client, userId)
    const result = await fn(client)
    await client.query('commit')
    return result
  } catch (error) {
    await client.query('rollback').catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}

export async function scalar<T>(tx: Tx | pg.Pool, sql: string, params: unknown[] = []) {
  const { rows } = await tx.query(sql, params)
  return Object.values(rows[0] as Record<string, T>)[0]
}

export const sql = {
  createSpace: (tx: Tx, name = 'Casa', split = 'equal') =>
    scalar<string>(tx, 'select public.create_space($1, $2)', [name, split]),
  invite: (tx: Tx, email: string | null) =>
    scalar<string>(tx, 'select public.create_invitation($1)', [email]),
  accept: (tx: Tx, token: string | null) =>
    scalar<string>(tx, 'select public.accept_invitation($1)', [token]),
}