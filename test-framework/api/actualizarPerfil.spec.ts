import { test, expect, send } from '../fixtures/endpointApi'

test('TC13_API_actualizarPerfil', async ({ actors }) => {
  await test.step('TC71_patchUsersMe', async () => {
    const response = await send(actors.a, 'patch', 'users/me', { name: 'Perfil cambiado' })
    expect(response.status()).toBe(200)
    expect((await response.json()).user.name).toBe('Perfil cambiado')
    expect((await (await actors.b.api.get('users/me')).json()).user.name).toBe(actors.b.name)
  })
})
