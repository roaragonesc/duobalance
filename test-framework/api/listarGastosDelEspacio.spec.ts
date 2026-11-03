import { test, expect, today } from '../fixtures/endpointApi'

test('TC34_API_listarGastosDelEspacio', async ({ household, expense }) => {
  await test.step('TC92_getSpacesIdExpenses', async () => {
    const response = await household.b.api.get(`spaces/${household.spaceId}/expenses`, { params: { month: today().slice(0, 7) } })
    expect(response.status()).toBe(200)
    expect(await response.json()).toMatchObject({ expenses: [expect.objectContaining({ id: expense.id })], totalCents: 8000, sharedCents: 8000, individualCents: 0 })
  })
})
