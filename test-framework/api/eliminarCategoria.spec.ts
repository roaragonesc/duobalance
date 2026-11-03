import { test, expect, send } from '../fixtures/endpointApi'

test('TC28_API_eliminarCategoria', async ({ household }) => {
  await test.step('TC86_deleteCategoriesId', async () => {
    const response = await send(household.a, 'delete', `categories/${household.categoryId}`)
    expect(response.status()).toBe(204)
    const list = await household.a.api.get('categories')
    expect((await list.json()).categories).not.toEqual(expect.arrayContaining([expect.objectContaining({ _id: household.categoryId })]))
  })
})
