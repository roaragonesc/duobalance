import { test as it, expect } from './fixtures.ts'
import {
  beginAs,
  createUser,
  asUser,
  scalar,
  sql,
  type TestDatabase,
  type Tx,
} from './testDatabase.ts'

// Real concurrency: two connections, the first holds its transaction open
// while the second runs and must wait on a row lock.

let db: TestDatabase
let ana: string
let bruno: string
let carla: string
let first: Tx
let second: Tx

async function waitUntilBlocked(client: Tx) {
  const pid = await scalar<number>(client, 'select pg_backend_pid()')
  return async (pending: Promise<unknown>) => {
    for (let i = 0; i < 200; i++) {
      const state = await scalar<string | null>(
        db.admin,
        'select wait_event_type from pg_stat_activity where pid = $1',
        [pid],
      )
      if (state === 'Lock') return
      await Promise.race([pending.catch(() => undefined), new Promise((r) => setTimeout(r, 25))])
    }
    throw new Error('The second transaction never waited for a lock')
  }
}

/** Runs op1 (left open), op2 concurrently, asserts op2 waits, commits op1, returns op2's outcome. */
async function race<T1, T2>(
  op1: { user: string | null; run: (tx: Tx) => Promise<T1> },
  op2: { user: string | null; run: (tx: Tx) => Promise<T2> },
) {
  await beginAs(first, op1.user)
  const result1 = await op1.run(first)
  await beginAs(second, op2.user)
  const awaitBlocked = await waitUntilBlocked(second)
  const pending = op2.run(second).then(
    async (value) => {
      await second.query('commit')
      return { ok: true as const, value }
    },
    async (error: Error) => {
      await second.query('rollback')
      return { ok: false as const, error }
    },
  )
  await awaitBlocked(pending)
  await first.query('commit')
  return { result1, result2: await pending }
}

it.beforeEach(async ({ database }) => {
  db = database
  ana = await createUser(db, 'ana@example.test')
  bruno = await createUser(db, 'bruno@example.test')
  carla = await createUser(db, 'carla@example.test')
  first = await db.connect()
  second = await db.connect()
})

it.afterEach(async () => {
  for (const client of [first, second]) {
    if (!client) continue
    try {
      await client.query('rollback')
    } finally {
      client.release()
    }
  }
})

const memberCount = () => scalar<number>(db.admin, 'select count(*)::int from public.space_members')

it.describe('concurrencia', () => {
  it('TC01_dosCreateSpaceSimultaneosDelMismoUsuarioUnoGanaSinEspaciosHuerfanos', async () => {
    const { result2 } = await race(
      { user: ana, run: (tx) => sql.createSpace(tx, 'A') },
      { user: ana, run: (tx) => sql.createSpace(tx, 'B') },
    )
    expect(result2).toMatchObject({ ok: false, error: { message: 'already_in_space' } })
    expect(await scalar(db.admin, 'select count(*)::int from public.spaces')).toBe(1)
    expect(await memberCount()).toBe(1)
  })

  it('TC02_dosAltasSimultaneasEnUnEspacioConUnMiembroLaSegundaFalla', async () => {
    const spaceId = await asUser(db, ana, (tx) => sql.createSpace(tx))
    const insert = (userId: string) => (tx: Tx) =>
      tx.query(
        "insert into public.space_members (space_id, user_id, role) values ($1, $2, 'member')",
        [spaceId, userId],
      )
    const { result2 } = await race(
      { user: null, run: async (tx) => { await tx.query('reset role'); return insert(bruno)(tx) } },
      { user: null, run: async (tx) => { await tx.query('reset role'); return insert(carla)(tx) } },
    )
    expect(result2).toMatchObject({ ok: false, error: { message: 'space_full' } })
    expect(await memberCount()).toBe(2)
  })

  it('TC03_dobleClicEnAceptarLaSegundaPeticionDevuelveElMismoEspacio', async () => {
    const spaceId = await asUser(db, ana, (tx) => sql.createSpace(tx))
    const token = await asUser(db, ana, (tx) => sql.invite(tx, 'bruno@example.test'))
    const { result1, result2 } = await race(
      { user: bruno, run: (tx) => sql.accept(tx, token) },
      { user: bruno, run: (tx) => sql.accept(tx, token) },
    )
    expect(result1).toBe(spaceId)
    expect(result2).toEqual({ ok: true, value: spaceId })
    expect(await memberCount()).toBe(2)
  })

  it('TC04_dosUsuariosAceptanLaMismaInvitacionALaVezSoloEntraUno', async () => {
    await asUser(db, ana, (tx) => sql.createSpace(tx))
    const token = await asUser(db, ana, (tx) => sql.invite(tx, 'bruno@example.test'))
    // Duplicate address only to force the race; the second user must still lose.
    const twin = await createUser(db, 'bruno@example.test')
    const { result2 } = await race(
      { user: bruno, run: (tx) => sql.accept(tx, token) },
      { user: twin, run: (tx) => sql.accept(tx, token) },
    )
    expect(result2).toMatchObject({ ok: false, error: { message: 'invitation_used' } })
    expect(await memberCount()).toBe(2)
  })

  it('TC05_reInvitarMientrasSeAceptaLaAnteriorLaAceptacionVeLaRevocacion', async () => {
    await asUser(db, ana, (tx) => sql.createSpace(tx))
    const old = await asUser(db, ana, (tx) => sql.invite(tx, 'bruno@example.test'))
    const { result2 } = await race(
      { user: ana, run: (tx) => sql.invite(tx, 'carla@example.test') },
      { user: bruno, run: (tx) => sql.accept(tx, old) },
    )
    expect(result2).toMatchObject({ ok: false, error: { message: 'invalid_invitation' } })
    expect(await memberCount()).toBe(1)
  })

  it('TC06_aceptarMientrasSeReInvitaLaNuevaInvitacionVeElEspacioLleno', async () => {
    await asUser(db, ana, (tx) => sql.createSpace(tx))
    const token = await asUser(db, ana, (tx) => sql.invite(tx, 'bruno@example.test'))
    const { result2 } = await race(
      { user: bruno, run: (tx) => sql.accept(tx, token) },
      { user: ana, run: (tx) => sql.invite(tx, 'carla@example.test') },
    )
    expect(result2).toMatchObject({ ok: false, error: { message: 'space_full' } })
    expect(await scalar(db.admin, 'select count(*)::int from public.space_invitations where revoked_at is null and accepted_at is null')).toBe(0)
  })

  it('TC07_crearUnEspacioMientrasSeAceptaUnaInvitacionSoloUnaPertenencia', async () => {
    await asUser(db, ana, (tx) => sql.createSpace(tx))
    const token = await asUser(db, ana, (tx) => sql.invite(tx, 'bruno@example.test'))
    const { result2 } = await race(
      { user: bruno, run: (tx) => sql.accept(tx, token) },
      { user: bruno, run: (tx) => sql.createSpace(tx, 'Mío') },
    )
    expect(result2).toMatchObject({ ok: false, error: { message: 'already_in_space' } })
    expect(await scalar(db.admin, 'select count(*)::int from public.spaces')).toBe(1)
  })
})