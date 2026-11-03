import { test, expect } from '../fixtures/endpointApi'

test('TC11_API_restablecerContrasena', async ({ request, account, confirmedAccount: _confirmed, mailToken }) => {
  const recovery = await request.post('auth/forgot-password', { data: { email: account.email } })
  expect(recovery.status()).toBe(202)
  const token = await mailToken('Recupera tu contraseña de DuoBalance')
  await test.step('TC69_postAuthResetPassword', async () => {
    const response = await request.post('auth/reset-password', { data: { token, password: 'Renovada123!' } })
    expect(response.status()).toBe(204)
    expect((await request.post('auth/login', { data: { email: account.email, password: 'Renovada123!' } })).status()).toBe(200)
    expect((await request.post('auth/login', { data: { email: account.email, password: account.password } })).status()).toBe(401)
  })
})
