import { test, expect } from '../fixtures/endpointApi'

test('TC43_API_listarLiquidaciones', async ({ household, settlementId }) => {
  await test.step('TC101_getSpacesIdSettlements', async () => {
    const response = await household.b.api.get(`spaces/${household.spaceId}/settlements`)
    expect(response.status()).toBe(200)
    expect((await response.json()).settlements).toEqual([expect.objectContaining({ _id: settlementId, amountCents: 1000 })])
  })
})
