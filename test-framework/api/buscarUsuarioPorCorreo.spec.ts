import { test, expect } from '../fixtures/endpointApi'

test('TC14_API_buscarUsuarioPorCorreo', async ({ actors }) => {
  await test.step('TC72_getUsers', async () => {
    const response = await actors.a.api.get('users', { params: { email: actors.b.email } })
    expect(response.status()).toBe(200)
    expect((await response.json()).users).toEqual([{ id: actors.b.id, name: actors.b.name, email: actors.b.email }])
  })
})
