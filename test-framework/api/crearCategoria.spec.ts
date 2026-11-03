import { test, expect, send } from '../fixtures/endpointApi'

test('TC26_API_crearCategoria', async ({ actors }) => {
  await test.step('TC84_postCategories', async () => {
    const response = await send(actors.a, 'post', 'categories', { name: 'Personal nueva', icon: 'food', color: '#00704A' })
    expect(response.status()).toBe(201)
    expect((await response.json()).category).toMatchObject({ name: 'Personal nueva', icon: 'food', color: '#00704A' })
  })
})
