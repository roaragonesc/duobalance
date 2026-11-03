import { test, expect } from '../fixtures/endpointApi'

test('TC06_API_iniciarSesion', async ({ request, account, confirmedAccount: _confirmed }) => {
  await test.step('TC64_postAuthLogin', async () => {
    const response = await request.post('auth/login', { data: { email: account.email, password: account.password } })
    expect(response.status()).toBe(200)
    expect(response.headers()['set-cookie']).toContain('HttpOnly')
    expect(await response.json()).toMatchObject({
      user: { email: account.email, confirmed: true }, csrfToken: expect.stringMatching(/^[a-f0-9]{64}$/),
    })
  })
})
