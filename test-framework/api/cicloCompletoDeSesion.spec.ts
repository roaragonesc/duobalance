import { test, expect } from '../fixtures/api'

test('TC46_API_cicloCompletoDeSesion', async ({ request, account, mailToken }) => {
  await test.step('TC104_registrarYConfirmarSinExponerHashes', async () => {
    const registration = await request.post('auth/register', { data: account })
    expect(registration.status()).toBe(202)
    const confirmationToken = await mailToken('Confirma tu cuenta de DuoBalance')
    const confirmation = await request.post('auth/confirm-email', { data: { token: confirmationToken } })
    expect(confirmation.status()).toBe(204)
    const reused = await request.post('auth/confirm-email', { data: { token: confirmationToken } })
    expect(reused.status()).toBe(400)
  })
  let csrfToken = ''
  await test.step('TC105_iniciarSesionConCookieHttpOnly', async () => {
    const response = await request.post('auth/login', { data: { email: account.email, password: account.password } })
    expect(response.status()).toBe(200)
    expect(response.headers()['set-cookie']).toContain('HttpOnly')
    expect(response.headers()['set-cookie']).toContain('SameSite=Lax')
    const result = await response.json()
    expect(result.user).toMatchObject({ name: account.name, email: account.email, confirmed: true })
    expect(result.user).not.toHaveProperty('passwordHash')
    expect(result.user).not.toHaveProperty('authVersion')
    expect(result.csrfToken).toMatch(/^[a-f0-9]{64}$/)
    csrfToken = result.csrfToken
    const me = await request.get('auth/me')
    expect(me.status()).toBe(200)
    expect((await me.json()).user.email).toBe(account.email)
  })
  await test.step('TC106_exigirCSRFYRevocarLaSesionAlSalir', async () => {
    const denied = await request.post('auth/logout', { data: {} })
    expect(denied.status()).toBe(403)
    const logout = await request.post('auth/logout', { data: {}, headers: { 'X-CSRF-Token': csrfToken } })
    expect(logout.status()).toBe(204)
    const me = await request.get('auth/me')
    expect(me.status()).toBe(401)
  })
})
