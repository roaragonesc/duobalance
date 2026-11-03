import { test, expect, send } from '../fixtures/endpointApi'

test('TC24_API_rechazarInvitacion', async ({ actors, pendingInvitation }) => {
  await test.step('TC82_postInvitationsTokenReject', async () => {
    const response = await send(actors.b, 'post', `invitations/${pendingInvitation.token}/reject`, {})
    expect(response.status()).toBe(200)
    expect(await response.json()).toEqual({ spaceId: pendingInvitation.spaceId })
    const list = await actors.b.api.get('invitations')
    expect((await list.json()).invitations).toEqual([expect.objectContaining({ status: 'rejected' })])
    expect((await actors.b.api.get(`spaces/${pendingInvitation.spaceId}`)).status()).toBe(404)
  })
})
