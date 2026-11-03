import { test, expect } from '../fixtures/endpointApi'

test('TC45_API_consultarLiquidacion', async ({ household, settlementId }) => {
  await test.step('TC103_getSettlementsId', async () => {
    const response = await household.b.api.get(`settlements/${settlementId}`)
    expect(response.status()).toBe(200)
    expect((await response.json()).settlement).toMatchObject({ _id: settlementId, amountCents: 1000, note: 'Pago endpoint' })
  })
})
