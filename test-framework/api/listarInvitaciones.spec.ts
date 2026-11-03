import { test, expect } from '../fixtures/endpointApi'

test('TC22_API_listarInvitaciones', async ({ actors, pendingInvitation }) => {
  await test.step('TC80_getInvitations', async () => {
    const response = await actors.b.api.get('invitations')
    expect(response.status()).toBe(200)
    expect((await response.json()).invitations).toEqual([expect.objectContaining({
      spaceId: pendingInvitation.spaceId, invitedEmail: actors.b.email, status: 'pending',
    })])
  })
})
