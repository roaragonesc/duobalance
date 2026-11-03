import { test, expect, today } from '../fixtures/endpointApi'

test('TC41_API_consultarBalance', async ({ household, expense: _expense }) => {
  await test.step('TC99_getSpacesIdBalance', async () => {
    const response = await household.a.api.get(`spaces/${household.spaceId}/balance`, { params: { month: today().slice(0, 7) } })
    expect(response.status()).toBe(200)
    expect(await response.json()).toMatchObject({
      month: { amountCents: 4000, debtor: 'partner' }, accumulated: { amountCents: 4000, debtor: 'partner' },
    })
  })
})
