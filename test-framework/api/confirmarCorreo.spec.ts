import { test, expect } from '../fixtures/endpointApi'

test('TC05_API_confirmarCorreo', async ({ request, registeredAccount: _registered, mailToken }) => {
  await test.step('TC63_postAuthConfirmEmail', async () => {
    const token = await mailToken('Confirma tu cuenta de DuoBalance')
    expect((await request.post('auth/confirm-email', { data: { token } })).status()).toBe(204)
    expect((await request.post('auth/confirm-email', { data: { token } })).status()).toBe(400)
  })
})
