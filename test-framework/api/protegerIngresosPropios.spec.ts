import { test, expect, send } from '../fixtures/financeApi'

test('TC54_API_protegerIngresosPropios', async ({ household }) => {
  const { a, b, outsider, spaceId } = household
  const input = { spaceId, description: 'Nómina', amountCents: 210000, date: new Date().toISOString().slice(0, 10) }
  const created = await send(a, 'post', 'incomes', input)
  expect(created.status()).toBe(201)
  const id = (await created.json()).income._id
  expect((await b.api.get(`incomes/${id}`)).status()).toBe(200)
  expect((await outsider.api.get(`incomes/${id}`)).status()).toBe(404)
  expect((await send(b, 'delete', `incomes/${id}`)).status()).toBe(404)
  const { spaceId: _space, ...update } = input
  expect((await send(a, 'patch', `incomes/${id}`, { ...update, amountCents: 220000 })).status()).toBe(200)
  expect((await send(a, 'delete', `incomes/${id}`)).status()).toBe(204)
})
