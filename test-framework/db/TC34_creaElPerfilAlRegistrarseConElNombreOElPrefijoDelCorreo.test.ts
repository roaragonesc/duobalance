import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { asUser, createTestDatabase, createUser, sql, type TestDatabase } from './testDatabase.ts'

let db: TestDatabase
beforeEach(async () => {
  db = await createTestDatabase()
})
afterEach(() => db.drop())

describe('profiles', () => {
  it('TC34_creaElPerfilAlRegistrarseConElNombreOElPrefijoDelCorreo', async () => {
    const { rows } = await db.admin.query<{ id: string }>(
      `insert into auth.users (email, raw_user_meta_data)
       values ('ana@example.test', '{"display_name":"  Ana  "}'), ('bruno@example.test', '{}')
       returning id`,
    )
    const profiles = await db.admin.query(
      'select id, display_name from public.profiles order by display_name',
    )
    expect(profiles.rows).toEqual([
      { id: rows[0].id, display_name: 'Ana' },
      { id: rows[1].id, display_name: 'bruno' },
    ])
  })

  it('TC35_cadaUsuarioSoloVeYEditaSuPropioPerfil', async () => {
    const ana = await createUser(db, 'ana@example.test')
    const bruno = await createUser(db, 'bruno@example.test')
    const seen = await asUser(db, ana, (tx) => tx.query('select id from public.profiles'))
    expect(seen.rows).toEqual([{ id: ana }])

    const updated = await asUser(db, ana, (tx) =>
      tx.query("update public.profiles set display_name = 'X' where id = $1", [bruno]),
    )
    expect(updated.rowCount).toBe(0)
    await asUser(db, ana, (tx) =>
      tx.query("update public.profiles set display_name = 'Ana B.' where id = $1", [ana]),
    )
    const { rows } = await db.admin.query(
      'select display_name, updated_at > created_at as touched from public.profiles where id = $1',
      [ana],
    )
    expect(rows).toEqual([{ display_name: 'Ana B.', touched: true }])
  })

  it.each([
    ['update public.profiles set id = gen_random_uuid()'],
    ['update public.profiles set created_at = now()'],
    ["insert into public.profiles (id, display_name) values (gen_random_uuid(), 'X')"],
    ['delete from public.profiles'],
  ])('TC36_denegarCambiosNoPermitidosEnPerfilesCaso%#', async (statement) => {
    const ana = await createUser(db, 'ana@example.test')
    await expect(asUser(db, ana, (tx) => tx.query(statement))).rejects.toMatchObject({
      code: '42501',
    })
  })

  it('TC37_validaLaLongitudDelNombre', async () => {
    const ana = await createUser(db, 'ana@example.test')
    await expect(
      asUser(db, ana, (tx) => tx.query("update public.profiles set display_name = '   '")),
    ).rejects.toMatchObject({ code: '23514' })
  })

  it('TC38_anonNoPuedeLeerPerfiles', async () => {
    await createUser(db, 'ana@example.test')
    await expect(
      asUser(db, null, (tx) => tx.query('select * from public.profiles')),
    ).rejects.toMatchObject({ code: '42501' })
  })

  it('TC39_unMiembroVeElNombreDeSuParejaPeroNoElDeOtrosUsuarios', async () => {
    const ana = await createUser(db, 'ana@example.test')
    const bruno = await createUser(db, 'bruno@example.test')
    const carla = await createUser(db, 'carla@example.test')
    const token = await asUser(db, ana, async (tx) => {
      await sql.createSpace(tx)
      return sql.invite(tx, 'bruno@example.test')
    })
    const ids = (rows: { id: string }[]) => rows.map((row) => row.id).sort()
    const read = (user: string) =>
      asUser(db, user, (tx) => tx.query<{ id: string }>('select id from public.profiles'))

    // Before joining, Bruno only sees himself.
    expect(ids((await read(bruno)).rows)).toEqual([bruno])
    await asUser(db, bruno, (tx) => sql.accept(tx, token))

    expect(ids((await read(ana)).rows)).toEqual([ana, bruno].sort())
    expect(ids((await read(bruno)).rows)).toEqual([ana, bruno].sort())
    expect(ids((await read(carla)).rows)).toEqual([carla])

    const updated = await asUser(db, bruno, (tx) =>
      tx.query("update public.profiles set display_name = 'X' where id = $1", [ana]),
    )
    expect(updated.rowCount).toBe(0)
  })

  it('TC40_borrarLaCuentaBorraElPerfil', async () => {
    const ana = await createUser(db, 'ana@example.test')
    await db.admin.query('delete from auth.users where id = $1', [ana])
    const { rowCount } = await db.admin.query('select 1 from public.profiles')
    expect(rowCount).toBe(0)
  })

  // Documented limitation of the applied migration: users without email
  // (anonymous or phone sign-in, not used by DuoBalance) cannot be created.
  it('TC41_documentaUnUsuarioSinCorreoNiNombreNoPuedeRegistrarse', async () => {
    await expect(createUser(db, null)).rejects.toMatchObject({ code: '23502' })
  })
})