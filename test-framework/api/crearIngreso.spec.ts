import { test, expect, send, today } from '../fixtures/endpointApi'

test('TC36_API_crearIngreso', async ({ household }) => {
  await test.step('TC94_postIncomes', async () => {
    const response = await send(household.a, 'post', 'incomes', { spaceId: household.spaceId, description: 'Nómina', amountCents: 120000, date: today() })
    expect(response.status()).toBe(201)
    expect((await response.json()).income).toMatchObject({ createdBy: household.a.id, amountCents: 120000, description: 'Nómina' })
  })
})
