import { test, expect, send } from '../fixtures/financeApi'

test('TC55_API_conservarRepartoHistorico', async ({ household }) => {
  const { a, b, spaceId, categoryId } = household
  const date = new Date().toISOString().slice(0, 10)
  expect((await send(a, 'patch', `spaces/${spaceId}`, { splitMethod: 'proportional' })).status()).toBe(200)
  for (const [actor, amountCents] of [[a, 30000], [b, 10000]] as const) {
    expect((await send(actor, 'post', 'incomes', { spaceId, description: 'Ingreso', amountCents, date })).status()).toBe(201)
  }
  const expense = await send(a, 'post', 'expenses', { spaceId, categoryId, description: 'Histórico', amountCents: 101, date, kind: 'shared' })
  expect(expense.status()).toBe(201)
  expect((await expense.json()).expense.ownerBasisPoints).toBe(7500)
  expect((await send(a, 'patch', `spaces/${spaceId}`, { splitMethod: 'equal' })).status()).toBe(200)
  expect((await send(b, 'post', 'incomes', { spaceId, description: 'Extra', amountCents: 100000, date })).status()).toBe(201)
  const balance = await a.api.get(`spaces/${spaceId}/balance`, { params: { month: date.slice(0, 7) } })
  expect(balance.status()).toBe(200)
  expect((await balance.json()).accumulated).toEqual({ amountCents: 25, debtor: 'partner' })
})
