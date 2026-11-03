import { test, expect, today } from '../fixtures/endpointApi'

test('TC35_API_listarIngresos', async ({ household, income }) => {
  await test.step('TC93_getIncomes', async () => {
    const response = await household.b.api.get('incomes', { params: { spaceId: household.spaceId, month: today().slice(0, 7) } })
    expect(response.status()).toBe(200)
    expect((await response.json()).incomes).toEqual([expect.objectContaining({ id: income.id, amountCents: 90000, owner: 'partner' })])
  })
})
