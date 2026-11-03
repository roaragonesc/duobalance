import { test, expect, send } from '../fixtures/endpointApi'

test('TC16_API_crearEspacio', async ({ actors }) => {
  await test.step('TC74_postSpaces', async () => {
    const response = await send(actors.a, 'post', 'spaces', { name: 'Espacio nuevo', splitMethod: 'equal' })
    expect(response.status()).toBe(201)
    expect((await response.json()).space).toMatchObject({ name: 'Espacio nuevo', createdBy: actors.a.id, members: [actors.a.id], splitMethod: 'equal' })
  })
})
