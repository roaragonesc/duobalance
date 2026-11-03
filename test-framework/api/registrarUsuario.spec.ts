import { test, expect } from '../fixtures/endpointApi'

test('TC03_API_registrarUsuario', async ({ request, account }) => {
  await test.step('TC61_postAuthRegister', async () => {
    const response = await request.post('auth/register', { data: account })
    expect(response.status()).toBe(202)
    expect(await response.json()).toEqual({ message: expect.any(String) })
    expect((await request.get('auth/me')).status()).toBe(401)
  })
})
