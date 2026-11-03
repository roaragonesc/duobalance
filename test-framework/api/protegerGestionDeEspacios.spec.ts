import { test, expect, send } from '../fixtures/financeApi'

test('TC50_API_protegerGestionDeEspacios', async ({ actors }) => {
  const { a, b } = actors
  const created = await send(a, 'post', 'spaces', { name: 'Hogar vacío', splitMethod: 'equal' })
  expect(created.status()).toBe(201)
  const id = (await created.json()).space._id
  expect((await send(a, 'post', 'spaces', { name: 'Duplicado', splitMethod: 'equal' })).status()).toBe(409)
  expect((await b.api.get(`spaces/${id}`)).status()).toBe(404)
  expect((await send(a, 'patch', `spaces/${id}`, { name: 'Nuevo nombre' })).status()).toBe(200)
  const detail = await a.api.get(`spaces/${id}`)
  expect((await detail.json()).space.name).toBe('Nuevo nombre')
  expect((await send(b, 'delete', `spaces/${id}`)).status()).toBe(404)
  expect((await send(a, 'delete', `spaces/${id}`)).status()).toBe(204)
  expect((await a.api.get(`spaces/${id}`)).status()).toBe(404)
})
