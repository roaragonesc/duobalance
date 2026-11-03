import { test, expect, send } from '../fixtures/financeApi'

test('TC53_API_protegerPrivacidadYPermisosDeGastos', async ({ household }) => {
  const date = new Date().toISOString().slice(0, 10)
  const { a, b, outsider, spaceId, categoryId } = household
  const input = { spaceId, categoryId, description: 'Común', amountCents: 8000, date, kind: 'shared' }
  const shared = await send(a, 'post', 'expenses', input)
  expect(shared.status()).toBe(201)
  const id = (await shared.json()).expense._id
  const secret = await send(a, 'post', 'expenses', { ...input, description: 'Privado', kind: 'individual', amountCents: 3500 })
  expect(secret.status()).toBe(201)
  const privateId = (await secret.json()).expense._id
  expect((await b.api.get(`expenses/${privateId}`)).status()).toBe(404)
  expect((await outsider.api.get(`expenses/${id}`)).status()).toBe(404)
  expect((await send(b, 'delete', `expenses/${id}`)).status()).toBe(404)
  const list = await b.api.get(`spaces/${spaceId}/expenses`, { params: { month: date.slice(0, 7) } })
  expect(list.status()).toBe(200)
  expect((await list.json()).expenses.map((item: { id: string }) => item.id)).toEqual([id])
  expect((await send(a, 'delete', `categories/${categoryId}`)).status()).toBe(409)
  expect((await send(a, 'delete', `spaces/${spaceId}`)).status()).toBe(409)
  const { spaceId: _space, ...update } = input
  expect((await send(b, 'patch', `expenses/${id}`, { ...update, amountCents: 10000 })).status()).toBe(404)
  expect((await send(a, 'patch', `expenses/${id}`, { ...update, amountCents: 10000 })).status()).toBe(200)
  expect((await send(a, 'post', 'expenses', { ...input, amountCents: 1.5 })).status()).toBe(400)
  expect((await send(a, 'post', 'expenses', { ...input, date: '2026-02-31' })).status()).toBe(400)
  expect((await send(a, 'delete', `expenses/${id}`)).status()).toBe(204)
})
