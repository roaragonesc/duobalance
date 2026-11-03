import { test, expect, today } from '../fixtures/endpointApi'

test('TC40_API_listarIngresosDelEspacio', async ({ household, income }) => {
  await test.step('TC98_getSpacesIdIncomes', async () => {
    const response = await household.a.api.get(`spaces/${household.spaceId}/incomes`, { params: { month: today().slice(0, 7) } })
    expect(response.status()).toBe(200)
    expect(await response.json()).toMatchObject({ incomes: [expect.objectContaining({ id: income.id })], totalCents: 90000, myCents: 90000, partnerCents: 0 })
  })
})
