import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  asUser,
  createTestDatabase,
  createUser,
  scalar,
  sql,
  type TestDatabase,
} from './testDatabase.ts'

let db: TestDatabase
let ana: string
let bruno: string
let carla: string

const count = (table: string) =>
  scalar<number>(db.admin, `select count(*)::int from public.${table}`)

const addMember = (spaceId: string, userId: string) =>
  db.admin.query(
    "insert into public.space_members (space_id, user_id, role) values ($1, $2, 'member')",
    [spaceId, userId],
  )

beforeEach(async () => {
  db = await createTestDatabase()
  ana = await createUser(db, 'ana@example.test')
  bruno = await createUser(db, 'bruno@example.test')
  carla = await createUser(db, 'carla@example.test')
})
afterEach(() => db.drop())

describe('create_space', () => {
  it('crea el espacio y el owner en una transacción', async () => {
    const spaceId = await asUser(db, ana, (tx) => sql.createSpace(tx, '  Casa  '))
    const visible = await asUser(db, ana, async (tx) => ({
      spaces: (await tx.query('select id, name, split_method from public.spaces')).rows,
      members: (await tx.query('select user_id, role from public.space_members')).rows,
    }))
    expect(visible).toEqual({
      spaces: [{ id: spaceId, name: 'Casa', split_method: 'equal' }],
      members: [{ user_id: ana, role: 'owner' }],
    })
  })

  it('rechaza peticiones sin autenticación', async () => {
    await expect(asUser(db, null, (tx) => sql.createSpace(tx))).rejects.toMatchObject({
      code: '42501',
    })
    // authenticated role without a user id in the JWT
    const client = await db.connect()
    try {
      await client.query('begin')
      await client.query('set local role authenticated')
      await expect(sql.createSpace(client)).rejects.toThrow('not_authenticated')
      await client.query('rollback')
    } finally {
      client.release()
    }
    expect(await count('spaces')).toBe(0)
  })

  it('un usuario solo puede tener un espacio', async () => {
    await asUser(db, ana, (tx) => sql.createSpace(tx))
    await expect(asUser(db, ana, (tx) => sql.createSpace(tx, 'Otra'))).rejects.toThrow(
      'already_in_space',
    )
    expect(await count('spaces')).toBe(1)
  })

  it.each([
    ['   ', 'equal'],
    ['x'.repeat(61), 'equal'],
    [null, 'equal'],
    ['Casa', 'thirds'],
    ['Casa', null],
  ])('valida datos (%s, %s) sin dejar nada a medias', async (name, split) => {
    await expect(
      asUser(db, ana, (tx) =>
        tx.query('select public.create_space($1, $2)', [name, split]),
      ),
    ).rejects.toMatchObject({ code: expect.stringMatching(/^23/) })
    expect(await count('spaces')).toBe(0)
    expect(await count('space_members')).toBe(0)
  })
})

describe('restricciones', () => {
  it('máximo dos miembros por espacio', async () => {
    const spaceId = await asUser(db, ana, (tx) => sql.createSpace(tx))
    await addMember(spaceId, bruno)
    await expect(addMember(spaceId, carla)).rejects.toThrow('space_full')
    expect(await count('space_members')).toBe(2)
  })

  it('mover un miembro a un espacio lleno también falla', async () => {
    const full = await asUser(db, ana, (tx) => sql.createSpace(tx))
    await addMember(full, bruno)
    await asUser(db, carla, (tx) => sql.createSpace(tx))
    await expect(
      db.admin.query('update public.space_members set space_id = $1 where user_id = $2', [
        full,
        carla,
      ]),
    ).rejects.toThrow('space_full')
  })

  it('un solo owner por espacio', async () => {
    const spaceId = await asUser(db, ana, (tx) => sql.createSpace(tx))
    await expect(
      db.admin.query(
        "insert into public.space_members (space_id, user_id, role) values ($1, $2, 'owner')",
        [spaceId, bruno],
      ),
    ).rejects.toMatchObject({ code: '23505' })
  })

  it('no hay espacios sin miembros', async () => {
    await expect(
      db.admin.query("insert into public.spaces (name, split_method) values ('V', 'equal')"),
    ).rejects.toThrow('space_without_members')
    expect(await count('spaces')).toBe(0)
  })
})

describe('RLS', () => {
  it('oculta espacios y miembros ajenos', async () => {
    const spaceId = await asUser(db, ana, (tx) => sql.createSpace(tx))
    const seen = await asUser(db, bruno, async (tx) => ({
      spaces: (await tx.query('select id from public.spaces')).rows,
      byId: (await tx.query('select id from public.spaces where id = $1', [spaceId])).rows,
      members: (await tx.query('select user_id from public.space_members')).rows,
      isMember: await scalar(tx, 'select public.is_space_member($1)', [spaceId]),
    }))
    expect(seen).toEqual({ spaces: [], byId: [], members: [], isMember: false })
  })

  it('ambos miembros ven el espacio y a su pareja', async () => {
    const spaceId = await asUser(db, ana, (tx) => sql.createSpace(tx))
    await addMember(spaceId, bruno)
    const { rows } = await asUser(db, bruno, (tx) =>
      tx.query('select user_id, role from public.space_members order by role desc'),
    )
    expect(rows).toEqual([
      { user_id: ana, role: 'owner' },
      { user_id: bruno, role: 'member' },
    ])
  })

  it.each([
    ["insert into public.spaces (name, split_method) values ('X', 'equal')"],
    ["update public.spaces set name = 'X'"],
    ["update public.spaces set split_method = 'proportional'"],
    ['delete from public.spaces'],
    ['delete from public.space_members'],
    ["update public.space_members set role = 'owner'"],
  ])('deniega escritura directa: %s', async (statement) => {
    await asUser(db, ana, (tx) => sql.createSpace(tx))
    await expect(asUser(db, ana, (tx) => tx.query(statement))).rejects.toMatchObject({
      code: '42501',
    })
  })

  it('deniega añadirse a un espacio ajeno', async () => {
    const spaceId = await asUser(db, ana, (tx) => sql.createSpace(tx))
    await expect(
      asUser(db, bruno, (tx) =>
        tx.query(
          "insert into public.space_members (space_id, user_id, role) values ($1, $2, 'member')",
          [spaceId, bruno],
        ),
      ),
    ).rejects.toMatchObject({ code: '42501' })
  })

  it.each([
    ['select * from public.spaces'],
    ['select * from public.space_members'],
    ['select public.is_space_member(gen_random_uuid())'],
  ])('anon no accede: %s', async (statement) => {
    await expect(asUser(db, null, (tx) => tx.query(statement))).rejects.toMatchObject({
      code: '42501',
    })
  })

  it('las funciones internas no se pueden invocar como RPC', async () => {
    await expect(
      asUser(db, ana, (tx) => tx.query('select public.handle_new_user()')),
    ).rejects.toMatchObject({ code: '42501' })
  })
})

describe('borrado de cuentas (casos documentados)', () => {
  it('si se borra el owner, el miembro sigue en un espacio sin owner', async () => {
    const spaceId = await asUser(db, ana, (tx) => sql.createSpace(tx))
    await addMember(spaceId, bruno)
    await db.admin.query('delete from auth.users where id = $1', [ana])
    const { rows } = await db.admin.query('select user_id, role from public.space_members')
    expect(rows).toEqual([{ user_id: bruno, role: 'member' }])
  })

  it('si se borran todos los miembros, el espacio queda vacío', async () => {
    await asUser(db, ana, (tx) => sql.createSpace(tx))
    await db.admin.query('delete from auth.users where id = $1', [ana])
    expect(await count('spaces')).toBe(1)
    expect(await count('space_members')).toBe(0)
  })
})