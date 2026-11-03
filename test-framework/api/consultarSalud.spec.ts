import { test, expect } from '../fixtures/endpointApi'

test('TC01_API_consultarSalud', async ({ request }) => {
  await test.step('TC59_getHealth', async () => {
    const response = await request.get('health')
    expect(response.status()).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok' })
  })
})
