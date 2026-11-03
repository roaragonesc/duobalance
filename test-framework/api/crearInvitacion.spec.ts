import { test, expect, send } from '../fixtures/endpointApi'

test('TC21_API_crearInvitacion', async ({ actors }) => {
  const created = await send(actors.a, 'post', 'spaces', { name: 'Para invitar', splitMethod: 'equal' })
  expect(created.status()).toBe(201)
  const spaceId = (await created.json()).space._id
  await test.step('TC79_postSpacesIdInvitations', async () => {
    const response = await send(actors.a, 'post', `spaces/${spaceId}/invitations`, { email: actors.b.email })
    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body.invitation).toMatchObject({ spaceId, invitedEmail: actors.b.email, status: 'pending' })
    expect(body.invitation).not.toHaveProperty('tokenHash')
    expect(body.token).toMatch(/^[a-f0-9]{64}$/)
  })
})
