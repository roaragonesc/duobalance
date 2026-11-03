import { test, expect, send } from '../fixtures/financeApi'

test('TC57_API_persistirRecorridoMultiusuario', async ({ household }) => {
  const { a, b, outsider, spaceId, categoryId } = household
  const date = new Date().toISOString().slice(0, 10)
  const base = { spaceId, categoryId, date, kind: 'shared', description: 'Supermercado' }
  expect((await send(a, 'post', 'expenses', { ...base, amountCents: 8000 })).status()).toBe(201)
  const secret = await send(a, 'post', 'expenses', { ...base, description: 'Privado', kind: 'individual', amountCents: 3500 })
  expect(secret.status()).toBe(201)
  const category = await send(b, 'post', 'categories', { name: 'Gasolina', icon: 'transport', color: '#1E5FB3' })
  expect(category.status()).toBe(201)
  expect((await send(b, 'post', 'expenses', { ...base, categoryId: (await category.json()).category._id, description: 'Gasolina', amountCents: 4000 })).status()).toBe(201)
  for (const actor of [a, b]) {
    const balance = await actor.api.get(`spaces/${spaceId}/balance`, { params: { month: date.slice(0, 7) } })
    expect(balance.status()).toBe(200)
    expect((await balance.json()).accumulated).toEqual({ amountCents: 2000, debtor: actor === a ? 'partner' : 'me' })
  }
  expect((await outsider.api.get(`spaces/${spaceId}/balance`, { params: { month: date.slice(0, 7) } })).status()).toBe(404)
  expect((await send(b, 'post', 'auth/logout', {})).status()).toBe(204)
  expect((await b.api.get(`expenses/${(await secret.json()).expense._id}`)).status()).toBe(401)
  expect((await a.api.get('auth/me')).status()).toBe(200)
  const logged = await b.api.post('auth/login', { data: { email: b.email, password: 'Pruebas1234!' } })
  expect(logged.status()).toBe(200)
  const list = await b.api.get('expenses', { params: { spaceId, month: date.slice(0, 7) } })
  expect((await list.json()).expenses).toHaveLength(2)
  expect((await b.api.get(`expenses/${(await secret.json()).expense._id}`)).status()).toBe(404)
})
