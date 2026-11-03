import { test, expect, send } from '../fixtures/endpointApi'

test('TC38_API_actualizarIngreso', async ({ household, income }) => {
  await test.step('TC96_patchIncomesId', async () => {
    const response = await send(household.a, 'patch', `incomes/${income.id}`, { ...income.input, amountCents: 123000 })
    expect(response.status()).toBe(200)
    expect((await response.json()).income).toMatchObject({ _id: income.id, amountCents: 123000 })
  })
})
