import EmbeddedPostgres from 'embedded-postgres'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestProject } from 'vitest/node'

const MIGRATIONS_DIR = join(import.meta.dirname, '..', 'migrations')
export const TEMPLATE_DB = 'duobalance_template'
const PORT = 54_329

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

declare module 'vitest' {
  export interface ProvidedContext {
    pgPort: number
  }
}

export default async function setup(project: TestProject) {
  const dataDir = mkdtempSync(join(tmpdir(), 'duobalance-pg-'))
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    port: PORT,
    user: 'postgres',
    password: 'postgres',
    // We delete the folder ourselves; the library's cleanup fails on Windows.
    persistent: true,
    onLog: () => {},
  })
  await pg.initialise()
  await pg.start()
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

  project.provide('pgPort', PORT)

  return async () => {
    await pg.stop()
    // Windows may keep the folder locked for a moment after the server stops.
    try {
      rmSync(dataDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
    } catch {
      console.warn(`Could not remove ${dataDir}`)
    }
  }
}