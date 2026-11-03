import { test, expect, today } from '../fixtures/endpointApi'

test('TC42_API_consultarResumen', async ({ household, expense: _expense }) => {
  await test.step('TC100_getSpacesIdSummary', async () => {
    const response = await household.a.api.get(`spaces/${household.spaceId}/summary`, { params: { month: today().slice(0, 7) } })
    expect(response.status()).toBe(200)
    expect(await response.json()).toMatchObject({
      totalCents: 8000, pending: { amountCents: 4000, debtor: 'partner' },
      recentExpenses: [expect.objectContaining({ amountCents: 8000 })],
    })
  })
})
