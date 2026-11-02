import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestDatabase, type TestDatabase } from './testDatabase.ts'

let db: TestDatabase
beforeEach(async () => {
  db = await createTestDatabase()
})
afterEach(() => db.drop())

const TABLES = ['profiles', 'spaces', 'space_members', 'space_invitations']

describe('integridad del esquema', () => {
  it('las migraciones crean todas las tablas con RLS activado', async () => {
    const { rows } = await db.admin.query(
      `select relname, relrowsecurity from pg_class
       where relnamespace = 'public'::regnamespace and relkind = 'r' order by relname`,
    )
    expect(rows).toEqual(
      [...TABLES].sort().map((relname) => ({ relname, relrowsecurity: true })),
    )
  })

  it('anon no tiene ningún privilegio sobre las tablas', async () => {
    const { rows } = await db.admin.query(
      `select table_name, privilege_type from information_schema.role_table_grants
       where table_schema = 'public' and grantee = 'anon'`,
    )
    expect(rows).toEqual([])
  })

  it('authenticated solo tiene los privilegios previstos', async () => {
    const { rows } = await db.admin.query(
      `select table_name || ':' || privilege_type as grant
       from information_schema.role_table_grants
       where table_schema = 'public' and grantee = 'authenticated' order by 1`,
    )
    expect(rows.map((row) => row.grant)).toEqual([
      'profiles:SELECT',
      'space_members:SELECT',
      'spaces:SELECT',
    ])
    const { rows: columns } = await db.admin.query(
      `select table_name, column_name, privilege_type from information_schema.column_privileges
       where table_schema = 'public' and grantee = 'authenticated' and privilege_type <> 'SELECT'`,
    )
    expect(columns).toEqual([
      { table_name: 'profiles', column_name: 'display_name', privilege_type: 'UPDATE' },
    ])
  })

  it('todas las funciones fijan search_path y solo exponen las RPC previstas', async () => {
    const { rows } = await db.admin.query<{
      proname: string
      prosecdef: boolean
      config: string[] | null
      anon: boolean
      authenticated: boolean
    }>(
      `select proname, prosecdef, proconfig as config,
              has_function_privilege('anon', oid, 'execute') as anon,
              has_function_privilege('authenticated', oid, 'execute') as authenticated
       from pg_proc where pronamespace = 'public'::regnamespace order by proname`,
    )
    for (const fn of rows) expect(fn.config, fn.proname).toContain('search_path=""')
    expect(rows.filter((fn) => fn.anon).map((fn) => fn.proname)).toEqual([])
    expect(rows.filter((fn) => fn.authenticated).map((fn) => fn.proname)).toEqual([
      'accept_invitation',
      'create_invitation',
      'create_space',
      'is_space_member',
    ])
    expect(rows.filter((fn) => fn.prosecdef).map((fn) => fn.proname)).toEqual([
      'accept_invitation',
      'create_invitation',
      'create_space',
      'handle_new_user',
      'is_space_member',
    ])
  })

  it('las claves foráneas tienen índice', async () => {
    const { rows } = await db.admin.query(
      `select c.conrelid::regclass::text || '.' || a.attname as fk
       from pg_constraint c
       join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
       where c.contype = 'f' and c.connamespace = 'public'::regnamespace
         and not exists (
           select 1 from pg_index i
           where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1] and i.indpred is null
         )`,
    )
    expect(rows).toEqual([])
  })
})