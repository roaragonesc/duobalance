import { test, expect, send } from '../fixtures/endpointApi'

test('TC18_API_actualizarEspacio', async ({ household }) => {
  await test.step('TC76_patchSpacesId', async () => {
    const response = await send(household.a, 'patch', `spaces/${household.spaceId}`, { name: 'Reparto cambiado', splitMethod: 'proportional' })
    expect(response.status()).toBe(200)
    expect((await response.json()).space).toMatchObject({ name: 'Reparto cambiado', splitMethod: 'proportional' })
  })
})
