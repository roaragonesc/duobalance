import { test as it, expect } from './fixtures.ts'
import {
  asUser,
  createUser,
  scalar,
  sql,
  type TestDatabase,
} from './testDatabase.ts'

let db: TestDatabase
let ana: string
let bruno: string
let carla: string

const members = (spaceId: string) =>
  db.admin
    .query('select user_id, role from public.space_members where space_id = $1 order by role desc', [
      spaceId,
    ])
    .then(({ rows }) => rows)

it.beforeEach(async ({ database }) => {
  db = database
  ana = await createUser(db, 'ana@example.test')
  bruno = await createUser(db, 'Bruno@Example.test')
  carla = await createUser(db, 'carla@example.test')
})

it.describe('create_invitation', () => {
  it('TC13_devuelveUnTokenAleatorioYSoloGuardaSuHashSHA256', async () => {
    await asUser(db, ana, (tx) => sql.createSpace(tx))
    const token = await asUser(db, ana, (tx) => sql.invite(tx, ' BRUNO@example.test '))
    const other = await asUser(db, ana, (tx) => sql.invite(tx, 'bruno@example.test'))
    expect(token).toMatch(/^[0-9a-f]{64}$/)
    expect(other).not.toBe(token)

    const { rows } = await db.admin.query(
      `select invited_email,
              token_hash = sha256(convert_to($1, 'UTF8')) as hashed,
              position(convert_to($1, 'UTF8') in token_hash) = 0 as not_plain,
              expires_at - created_at as ttl
       from public.space_invitations order by created_at limit 1`,
      [token],
    )
    expect(rows).toEqual([
      {
        invited_email: 'bruno@example.test',
        hashed: true,
        not_plain: true,
        ttl: expect.objectContaining({ days: 7 }),
      },
    ])
  })

  it('TC14_exigeSesion', async () => {
    await expect(
      asUser(db, null, (tx) => sql.invite(tx, 'x@example.test')),
    ).rejects.toMatchObject({ code: '42501' })
  })

  it('TC15_soloElOwnerPuedeInvitarNuncaASiMismoNiConElEspacioLleno', async () => {
    await expect(asUser(db, ana, (tx) => sql.invite(tx, 'b@example.test'))).rejects.toThrow(
      'not_space_owner',
    )
    const spaceId = await asUser(db, ana, (tx) => sql.createSpace(tx))
    await expect(asUser(db, ana, (tx) => sql.invite(tx, 'ANA@example.test'))).rejects.toThrow(
      'cannot_invite_self',
    )
    const token = await asUser(db, ana, (tx) => sql.invite(tx, 'bruno@example.test'))
    await asUser(db, bruno, (tx) => sql.accept(tx, token))
    expect(await members(spaceId)).toHaveLength(2)
    await expect(asUser(db, bruno, (tx) => sql.invite(tx, 'c@example.test'))).rejects.toThrow(
      'not_space_owner',
    )
    await expect(asUser(db, ana, (tx) => sql.invite(tx, 'carla@example.test'))).rejects.toThrow(
      'space_full',
    )
  })

  for (const [index, email] of [null, '', '   ', 'no-es-un-correo', 'a@b', 'a b@c.es', `${'a'.repeat(250)}@x.es`].entries()) {
    it(`TC16_rechazaCorreosNoValidosCaso${index}`, async () => {
      await asUser(db, ana, (tx) => sql.createSpace(tx))
      await expect(asUser(db, ana, (tx) => sql.invite(tx, email))).rejects.toMatchObject({
        code: '22023',
        message: 'invalid_email',
      })
    })
  }

  it('TC17_permiteUnaInvitacionNuevaCuandoLaAnteriorHaCaducado', async () => {
    await asUser(db, ana, (tx) => sql.createSpace(tx))
    const expired = await asUser(db, ana, (tx) => sql.invite(tx, 'bruno@example.test'))
    await db.admin.query(
      "update public.space_invitations set expires_at = now() - interval '1 second'",
    )
    const fresh = await asUser(db, ana, (tx) => sql.invite(tx, 'bruno@example.test'))
    await expect(asUser(db, bruno, (tx) => sql.accept(tx, expired))).rejects.toThrow(
      'invalid_invitation',
    )
    await expect(asUser(db, bruno, (tx) => sql.accept(tx, fresh))).resolves.toBeTruthy()
  })

  it('TC18_limitaA10InvitacionesPorEspacioCada24Horas', async () => {
    await asUser(db, ana, (tx) => sql.createSpace(tx))
    for (let i = 0; i < 10; i++) {
      await asUser(db, ana, (tx) => sql.invite(tx, 'bruno@example.test'))
    }
    await expect(asUser(db, ana, (tx) => sql.invite(tx, 'bruno@example.test'))).rejects.toThrow(
      'too_many_invitations',
    )
    await db.admin.query("update public.space_invitations set created_at = now() - interval '25 hours'")
    await expect(asUser(db, ana, (tx) => sql.invite(tx, 'bruno@example.test'))).resolves.toMatch(
      /^[0-9a-f]{64}$/,
    )
  })

  it('TC19_unaInvitacionNuevaRevocaLaAnterior', async () => {
    await asUser(db, ana, (tx) => sql.createSpace(tx))
    const first = await asUser(db, ana, (tx) => sql.invite(tx, 'bruno@example.test'))
    const second = await asUser(db, ana, (tx) => sql.invite(tx, 'bruno@example.test'))
    await expect(asUser(db, bruno, (tx) => sql.accept(tx, first))).rejects.toThrow(
      'invalid_invitation',
    )
    await expect(asUser(db, bruno, (tx) => sql.accept(tx, second))).resolves.toBeTruthy()
  })
})

it.describe('accept_invitation', () => {
  let spaceId: string
  let token: string

  it.beforeEach(async () => {
    spaceId = await asUser(db, ana, (tx) => sql.createSpace(tx))
    token = await asUser(db, ana, (tx) => sql.invite(tx, 'bruno@example.test'))
  })

  it('TC20_uneAlInvitadoComoMemberYEsIdempotente', async () => {
    expect(await asUser(db, bruno, (tx) => sql.accept(tx, token))).toBe(spaceId)
    expect(await asUser(db, bruno, (tx) => sql.accept(tx, token))).toBe(spaceId)
    expect(await members(spaceId)).toEqual([
      { user_id: ana, role: 'owner' },
      { user_id: bruno, role: 'member' },
    ])
    const { rows } = await db.admin.query(
      'select accepted_by from public.space_invitations',
    )
    expect(rows).toEqual([{ accepted_by: bruno }])
  })

  for (const [index, fake] of [null, '', 'x'.repeat(64), 'a'.repeat(10_000)].entries()) {
    it(`TC21_rechazaTokensFalsosCaso${index}`, async () => {
      await expect(asUser(db, bruno, (tx) => sql.accept(tx, fake))).rejects.toThrow(
        'invalid_invitation',
      )
    })
  }

  it('TC22_rechazaUnTokenConUnCaracterCambiado', async () => {
    const forged = token.slice(0, -1) + (token.endsWith('0') ? '1' : '0')
    await expect(asUser(db, bruno, (tx) => sql.accept(tx, forged))).rejects.toThrow(
      'invalid_invitation',
    )
  })

  it('TC23_exigeSesion', async () => {
    await expect(asUser(db, null, (tx) => sql.accept(tx, token))).rejects.toMatchObject({
      code: '42501',
    })
  })

  it('TC24_soloLaAceptaElCorreoInvitado', async () => {
    await expect(asUser(db, carla, (tx) => sql.accept(tx, token))).rejects.toThrow(
      'invitation_email_mismatch',
    )
    expect(await members(spaceId)).toHaveLength(1)
  })

  it('TC25_exigeQueElCorreoEsteConfirmado', async () => {
    await db.admin.query('update auth.users set email_confirmed_at = null where id = $1', [bruno])
    await expect(asUser(db, bruno, (tx) => sql.accept(tx, token))).rejects.toThrow(
      'invitation_email_mismatch',
    )
  })

  it('TC26_unUsuarioSinCorreoAnonimoNoPuedeAceptarla', async () => {
    const anonymous = await createUser(db, 'temp@example.test')
    await db.admin.query('update auth.users set email = null where id = $1', [anonymous])
    await expect(asUser(db, anonymous, (tx) => sql.accept(tx, token))).rejects.toThrow(
      'invitation_email_mismatch',
    )
  })

  it('TC27_esDeUnSoloUso', async () => {
    await asUser(db, bruno, (tx) => sql.accept(tx, token))
    const twin = await createUser(db, 'bruno@example.test')
    await expect(asUser(db, twin, (tx) => sql.accept(tx, token))).rejects.toThrow(
      'invitation_used',
    )
  })

  it('TC28_rechazaInvitacionesCaducadas', async () => {
    await db.admin.query(
      "update public.space_invitations set expires_at = now() - interval '1 second'",
    )
    await expect(asUser(db, bruno, (tx) => sql.accept(tx, token))).rejects.toThrow(
      'invitation_expired',
    )
    expect(await members(spaceId)).toHaveLength(1)
  })

  it('TC29_rechazaInvitacionesRevocadas', async () => {
    await db.admin.query('update public.space_invitations set revoked_at = now()')
    await expect(asUser(db, bruno, (tx) => sql.accept(tx, token))).rejects.toThrow(
      'invalid_invitation',
    )
  })

  it('TC30_noPermiteUnirseSiYaPertenecesAOtroEspacio', async () => {
    await asUser(db, bruno, (tx) => sql.createSpace(tx))
    await expect(asUser(db, bruno, (tx) => sql.accept(tx, token))).rejects.toThrow(
      'already_in_space',
    )
    expect(await members(spaceId)).toHaveLength(1)
  })

  it('TC31_elOwnerNoPuedeAceptarSuPropiaInvitacion', async () => {
    await expect(asUser(db, ana, (tx) => sql.accept(tx, token))).rejects.toThrow(
      'invitation_email_mismatch',
    )
  })
})

it.describe('RLS de space_invitations', () => {
  for (const [index, [statement]] of [
    ['select * from public.space_invitations'],
    ["update public.space_invitations set expires_at = now() + interval '1 year'"],
    ['delete from public.space_invitations'],
    [
      "insert into public.space_invitations (space_id, invited_email, token_hash, created_by) values (gen_random_uuid(), 'x@y.es', '\\x00', gen_random_uuid())",
    ],
  ].entries()) {
    it(`TC32_deniegaAccesoDirectoCaso${index}`, async () => {
    await asUser(db, ana, (tx) => sql.createSpace(tx))
    await asUser(db, ana, (tx) => sql.invite(tx, 'bruno@example.test'))
    for (const user of [ana, bruno, null]) {
      await expect(asUser(db, user, (tx) => tx.query(statement))).rejects.toMatchObject({
        code: '42501',
        })
      }
    }
  })

  it('TC33_borrarAlOwnerBorraSusInvitaciones', async () => {
    await asUser(db, ana, (tx) => sql.createSpace(tx))
    await asUser(db, ana, (tx) => sql.invite(tx, 'bruno@example.test'))
    await db.admin.query('delete from auth.users where id = $1', [ana])
    expect(await scalar(db.admin, 'select count(*)::int from public.space_invitations')).toBe(0)
  })
})