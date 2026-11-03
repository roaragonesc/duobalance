import { test, expect, send, today } from '../fixtures/endpointApi'

test('TC44_API_crearLiquidacionParcial', async ({ household, expense: _expense }) => {
  await test.step('TC102_postSpacesIdSettlements', async () => {
    const response = await send(household.b, 'post', `spaces/${household.spaceId}/settlements`, { date: today(), amountCents: 1000, note: 'Parcial' })
    expect(response.status()).toBe(201)
    expect((await response.json()).settlement).toMatchObject({ amountCents: 1000, fromUserId: household.b.id, toUserId: household.a.id })
    const balance = await household.a.api.get(`spaces/${household.spaceId}/balance`, { params: { month: today().slice(0, 7) } })
    expect((await balance.json()).accumulated).toEqual({ amountCents: 3000, debtor: 'partner' })
  })
})
