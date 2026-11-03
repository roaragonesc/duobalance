import { test, expect } from '../fixtures/endpointApi'

test('TC10_API_solicitarRecuperacion', async ({ request, account, confirmedAccount: _confirmed, mailToken }) => {
  await test.step('TC68_postAuthForgotPassword', async () => {
    const response = await request.post('auth/forgot-password', { data: { email: account.email } })
    expect(response.status()).toBe(202)
    expect(await response.json()).toEqual({ message: expect.any(String) })
    expect(await mailToken('Recupera tu contraseña de DuoBalance')).toMatch(/^[a-f0-9]{64}$/)
  })
})
