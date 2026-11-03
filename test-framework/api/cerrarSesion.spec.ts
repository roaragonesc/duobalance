import { test, expect } from '../fixtures/endpointApi'

test('TC07_API_cerrarSesion', async ({ request, authenticatedAccount }) => {
  await test.step('TC65_postAuthLogout', async () => {
    const response = await request.post('auth/logout', { data: {}, headers: { 'X-CSRF-Token': authenticatedAccount.csrf } })
    expect(response.status()).toBe(204)
    expect((await request.get('auth/me')).status()).toBe(401)
  })
})
