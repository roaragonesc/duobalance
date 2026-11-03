import { test, expect } from '../fixtures/api'

test('TC47_API_rechazarEntradasYOrigenInvalidos', async ({ request }) => {
  const invalid = await request.post('auth/register', { data: {
    name: '', email: 'incorrecto', password: 'corta', confirmed: true,
  } })
  expect(invalid.status()).toBe(400)
  expect((await invalid.json()).error.code).toBe('invalid_input')
  const origin = await request.post('auth/login', {
    headers: { Origin: 'http://otro-origen.test' }, data: { email: 'cuenta@duobalance.test', password: 'Pruebas1234!' },
  })
  expect(origin.status()).toBe(403)
})
