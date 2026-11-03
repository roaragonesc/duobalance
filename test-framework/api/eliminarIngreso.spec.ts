import { test, expect, send } from '../fixtures/endpointApi'

test('TC39_API_eliminarIngreso', async ({ household, income }) => {
  await test.step('TC97_deleteIncomesId', async () => {
    const response = await send(household.a, 'delete', `incomes/${income.id}`)
    expect(response.status()).toBe(204)
    expect((await household.a.api.get(`incomes/${income.id}`)).status()).toBe(404)
  })
})
