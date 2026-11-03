import { test, expect, today } from '../fixtures/endpointApi'

test('TC29_API_listarGastos', async ({ household, expense }) => {
  await test.step('TC87_getExpenses', async () => {
    const response = await household.b.api.get('expenses', { params: { spaceId: household.spaceId, month: today().slice(0, 7) } })
    expect(response.status()).toBe(200)
    expect((await response.json()).expenses).toEqual([expect.objectContaining({ id: expense.id, amountCents: 8000, canEdit: false })])
  })
})
