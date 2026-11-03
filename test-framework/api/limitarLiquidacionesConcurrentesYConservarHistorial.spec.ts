import { test, expect, send } from '../fixtures/financeApi'

test('TC56_API_limitarLiquidacionesConcurrentesYConservarHistorial', async ({ household }) => {
  const { a, spaceId, categoryId } = household
  const date = new Date().toISOString().slice(0, 10)
  const expense = await send(a, 'post', 'expenses', { spaceId, categoryId, description: 'Común', amountCents: 8000, date, kind: 'shared' })
  expect(expense.status()).toBe(201)
  const payments = await Promise.all([1, 2].map(() => send(a, 'post', `spaces/${spaceId}/settlements`, { date, amountCents: 3000, note: null })))
  expect(payments.map((item) => item.status()).sort()).toEqual([201, 409])
  const history = await a.api.get(`spaces/${spaceId}/settlements`)
  expect((await history.json()).settlements).toHaveLength(1)
  const id = (await expense.json()).expense._id
  expect((await send(a, 'patch', `expenses/${id}`, { categoryId, description: 'Corregido', amountCents: 10000, date, kind: 'shared' })).status()).toBe(200)
  const balance = await a.api.get(`spaces/${spaceId}/balance`, { params: { month: date.slice(0, 7) } })
  expect((await balance.json()).accumulated).toEqual({ amountCents: 2000, debtor: 'partner' })
  expect((await (await a.api.get(`spaces/${spaceId}/settlements`)).json()).settlements).toHaveLength(1)
})
