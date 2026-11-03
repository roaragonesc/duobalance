import { test, expect } from '../fixtures/endpointApi'

test('TC31_API_consultarGasto', async ({ household, expense }) => {
  await test.step('TC89_getExpensesId', async () => {
    const response = await household.b.api.get(`expenses/${expense.id}`)
    expect(response.status()).toBe(200)
    expect((await response.json()).expense).toMatchObject({ _id: expense.id, ...expense.input })
  })
})
