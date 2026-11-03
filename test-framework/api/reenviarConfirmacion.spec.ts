import { test, expect } from '../fixtures/endpointApi'

test('TC04_API_reenviarConfirmacion', async ({ request, account, registeredAccount: _registered, mailToken }) => {
  await test.step('TC62_postAuthResendConfirmation', async () => {
    const response = await request.post('auth/resend-confirmation', { data: { email: account.email } })
    expect(response.status()).toBe(202)
    expect(await response.json()).toEqual({ message: expect.any(String) })
    expect(await mailToken('Confirma tu cuenta de DuoBalance')).toMatch(/^[a-f0-9]{64}$/)
  })
})
