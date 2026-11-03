import { test, expect, send } from '../fixtures/endpointApi'

test('TC27_API_actualizarCategoria', async ({ household }) => {
  await test.step('TC85_patchCategoriesId', async () => {
    const response = await send(household.a, 'patch', `categories/${household.categoryId}`, { name: 'Personal editada', icon: 'food', color: '#00704A' })
    expect(response.status()).toBe(200)
    expect((await response.json()).category).toMatchObject({ _id: household.categoryId, name: 'Personal editada' })
  })
})
