import { test, expect } from '../fixtures/endpointApi'

test('TC09_API_renovarCsrf', async ({ request, authenticatedAccount }) => {
  await test.step('TC67_getAuthCsrf', async () => {
    const response = await request.get('auth/csrf')
    expect(response.status()).toBe(200)
    const { csrfToken } = await response.json()
    expect(csrfToken).toMatch(/^[a-f0-9]{64}$/)
    expect(csrfToken).not.toBe(authenticatedAccount.csrf)
    expect((await request.post('auth/logout', { data: {}, headers: { 'X-CSRF-Token': authenticatedAccount.csrf } })).status()).toBe(403)
    expect((await request.post('auth/logout', { data: {}, headers: { 'X-CSRF-Token': csrfToken } })).status()).toBe(204)
  })
})
