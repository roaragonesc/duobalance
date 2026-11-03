import EmbeddedPostgres from 'embedded-postgres'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { join } from 'node:path'

const MIGRATIONS_DIR = join(import.meta.dirname, '..', '..', 'supabase', 'migrations')
const TEMPLATE_DB = 'duobalance_template'

async function availablePort(): Promise<number> {
  const server = createServer()
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('No PostgreSQL test port available')
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
  return address.port
}

// What Supabase provides before our migrations run: API roles, auth.users,
// auth.uid() and the default privileges of the public schema.
const SUPABASE_STUB = `
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;

  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    email_confirmed_at timestamptz,
    raw_user_meta_data jsonb not null default '{}'
  );
  create function auth.uid() returns uuid language sql stable as $$
    select coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
    )::uuid
  $$;

  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public
    grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public
    grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public
    grant all on sequences to anon, authenticated, service_role;
`

export default async function setup() {
  const port = await availablePort()
  const dataDir = mkdtempSync(join(import.meta.dirname, '.postgres-'))
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    port,
    user: 'postgres',
    password: 'postgres',
    // We delete the folder ourselves; the library's cleanup fails on Windows.
    persistent: true,
    onLog: () => {},
  })
  let started = false
  const cleanup = async () => {
    try {
      if (started) await pg.stop()
    } finally {
      rmSync(dataDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
    }
  }
  try {
    await pg.initialise()
    await pg.start()
    started = true
    await pg.createDatabase(TEMPLATE_DB)

    const client = pg.getPgClient(TEMPLATE_DB)
    await client.connect()
    try {
      await client.query(SUPABASE_STUB)
      const files = readdirSync(MIGRATIONS_DIR)
        .filter((file) => file.endsWith('.sql'))
        .sort()
      // Each file is sent as one simple query: an implicit transaction, like the CLI.
      for (const file of files) {
        try {
          await client.query(readFileSync(join(MIGRATIONS_DIR, file), 'utf8'))
        } catch (error) {
          throw new Error(`Migration ${file} failed: ${String(error)}`)
        }
      }
    } finally {
      await client.end()
    }

    process.env.DUOBALANCE_PG_TEST_PORT = String(port)
    return cleanup
  } catch (error) {
    await cleanup()
    throw error
  }
}