import { test as it, expect } from './fixtures.ts'
import type { TestDatabase } from './testDatabase.ts'

let db: TestDatabase
it.beforeEach(async ({ database }) => {
  db = database
})

const TABLES = ['profiles', 'spaces', 'space_members', 'space_invitations']

it.describe('integridad del esquema', () => {
  it('TC08_lasMigracionesCreanTodasLasTablasConRLSActivado', async () => {
    const { rows } = await db.admin.query(
      `select relname, relrowsecurity from pg_class
       where relnamespace = 'public'::regnamespace and relkind = 'r' order by relname`,
    )
    expect(rows).toEqual(
      [...TABLES].sort().map((relname) => ({ relname, relrowsecurity: true })),
    )
  })

  it('TC09_anonNoTieneNingunPrivilegioSobreLasTablas', async () => {
    const { rows } = await db.admin.query(
      `select table_name, privilege_type from information_schema.role_table_grants
       where table_schema = 'public' and grantee = 'anon'`,
    )
    expect(rows).toEqual([])
  })

  it('TC10_authenticatedSoloTieneLosPrivilegiosPrevistos', async () => {
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

  it('TC11_todasLasFuncionesFijanSearchPathYSoloExponenLasRPCPrevistas', async () => {
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

  it('TC12_lasClavesForaneasTienenIndice', async () => {
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