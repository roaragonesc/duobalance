import { test, expect, send } from '../fixtures/endpointApi'

test('TC19_API_eliminarEspacioVacio', async ({ actors, pendingInvitation }) => {
  await test.step('TC77_deleteSpacesId', async () => {
    const response = await send(actors.a, 'delete', `spaces/${pendingInvitation.spaceId}`)
    expect(response.status()).toBe(204)
    expect((await actors.a.api.get(`spaces/${pendingInvitation.spaceId}`)).status()).toBe(404)
  })
})
