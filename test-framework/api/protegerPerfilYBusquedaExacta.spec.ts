import { test, expect } from '../fixtures/api'

test('TC49_API_protegerPerfilYBusquedaExacta', async ({ request, account, mailToken }) => {
  const registration = await request.post('auth/register', { data: account })
  expect(registration.status()).toBe(202)
  const confirmed = await request.post('auth/confirm-email', { data: { token: await mailToken('Confirma tu cuenta de DuoBalance') } })
  expect(confirmed.status()).toBe(204)
  const login = await request.post('auth/login', { data: { email: account.email, password: account.password } })
  expect(login.status()).toBe(200)
  const { csrfToken } = await login.json()
  const update = await request.patch('users/me', { data: { name: 'Nombre actualizado' }, headers: { 'X-CSRF-Token': csrfToken } })
  expect(update.status()).toBe(200)
  expect((await update.json()).user.name).toBe('Nombre actualizado')
  const me = await request.get('users/me')
  expect(me.status()).toBe(200)
  expect((await me.json()).user.name).toBe('Nombre actualizado')
  const lookup = await request.get('users', { params: { email: account.email } })
  expect(lookup.status()).toBe(200)
  expect((await lookup.json()).users).toEqual([expect.objectContaining({ email: account.email, name: 'Nombre actualizado' })])
  const directory = await request.get('users')
  expect(directory.status()).toBe(400)
  const massAssignment = await request.patch('users/me', {
    data: { name: 'Otro', email: 'ajeno@duobalance.test', confirmed: true },
    headers: { 'X-CSRF-Token': csrfToken },
  })
  expect(massAssignment.status()).toBe(400)
})
