import { test, expect } from '../fixtures/endpointApi'

test('TC25_API_listarCategorias', async ({ household }) => {
  await test.step('TC83_getCategories', async () => {
    const response = await household.a.api.get('categories')
    expect(response.status()).toBe(200)
    expect((await response.json()).categories).toEqual(expect.arrayContaining([expect.objectContaining({ _id: household.categoryId })]))
  })
})
