import { test, expect, send } from '../fixtures/financeApi'

test('TC51_API_limitarInvitacionesYMiembros', async ({ actors }) => {
  const { a, b, outsider } = actors
  const created = await send(a, 'post', 'spaces', { name: 'Invitaciones', splitMethod: 'equal' })
  expect(created.status()).toBe(201)
  const id = (await created.json()).space._id
  const invitation = await send(a, 'post', `spaces/${id}/invitations`, { email: b.email })
  expect(invitation.status()).toBe(201)
  const { token, invitation: body } = await invitation.json()
  expect(body).not.toHaveProperty('tokenHash')
  expect((await send(outsider, 'post', `invitations/${token}/accept`, {})).status()).toBe(404)
  expect((await send(b, 'post', `invitations/${token}/accept`, {})).status()).toBe(200)
  expect((await send(b, 'post', `invitations/${token}/accept`, {})).status()).toBe(404)
  const members = await a.api.get(`spaces/${id}/members`)
  expect((await members.json()).members).toHaveLength(2)
  expect((await send(a, 'post', `spaces/${id}/invitations`, { email: outsider.email })).status()).toBe(409)
})
