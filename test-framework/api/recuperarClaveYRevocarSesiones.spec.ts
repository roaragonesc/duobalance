import { test, expect } from '../fixtures/api'

test('TC48_API_recuperarClaveYRevocarSesiones', async ({ request, playwright, baseURL, account, mailToken }) => {
  const registration = await request.post('auth/register', { data: account })
  expect(registration.status()).toBe(202)
  const confirmation = await request.post('auth/confirm-email', { data: { token: await mailToken('Confirma tu cuenta de DuoBalance') } })
  expect(confirmation.status()).toBe(204)
  const login = await request.post('auth/login', { data: { email: account.email, password: account.password } })
  expect(login.status()).toBe(200)
  const otherSession = await playwright.request.newContext({
    baseURL, extraHTTPHeaders: { Origin: 'http://localhost:5173' },
  })
  try {
    const otherLogin = await otherSession.post('auth/login', { data: { email: account.email, password: account.password } })
    expect(otherLogin.status()).toBe(200)
    const forgot = await request.post('auth/forgot-password', { data: { email: account.email } })
    expect(forgot.status()).toBe(202)
    const value = await mailToken('Recupera tu contraseña de DuoBalance')
    const reset = await request.post('auth/reset-password', { data: { token: value, password: 'NuevaClave123!' } })
    expect(reset.status()).toBe(204)
    const revoked = await otherSession.get('auth/me')
    expect(revoked.status()).toBe(401)
    const reused = await request.post('auth/reset-password', { data: { token: value, password: 'OtraClave123!' } })
    expect(reused.status()).toBe(400)
    const oldPassword = await request.post('auth/login', { data: { email: account.email, password: account.password } })
    expect(oldPassword.status()).toBe(401)
    const newPassword = await request.post('auth/login', { data: { email: account.email, password: 'NuevaClave123!' } })
    expect(newPassword.status()).toBe(200)
  } finally {
    await otherSession.dispose()
  }
})
