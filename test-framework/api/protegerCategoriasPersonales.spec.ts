import { test, expect, send } from '../fixtures/financeApi'

test('TC52_API_protegerCategoriasPersonales', async ({ actors }) => {
  const { a, b } = actors
  const input = { name: 'Personal', icon: 'other', color: '#123456' }
  const created = await send(a, 'post', 'categories', input)
  expect(created.status()).toBe(201)
  const id = (await created.json()).category._id
  expect((await send(b, 'patch', `categories/${id}`, input)).status()).toBe(404)
  expect((await send(a, 'patch', `categories/${id}`, { ...input, name: 'Actualizada' })).status()).toBe(200)
  const list = await b.api.get('categories')
  expect((await list.json()).categories.map((item: { _id: string }) => item._id)).not.toContain(id)
  expect((await send(a, 'delete', `categories/${id}`)).status()).toBe(204)
})
