import { readdir, readFile } from 'node:fs/promises'
import { test, expect } from '../fixtures/endpointApi'

test('TC02_API_consultarOpenApi', async ({ request }) => {
  await test.step('TC60_getApiDocs', async () => {
    const response = await request.get('api-docs')
    expect(response.status()).toBe(200)
    const document: { openapi: string; paths: Record<string, Record<string, object>> } = await response.json()
    expect(document.openapi).toBe('3.1.0')
    const operations = Object.entries(document.paths).flatMap(([path, methods]) =>
      Object.keys(methods).map((method) => `${method.toUpperCase()} ${path}`))
    const directory = new URL('./', import.meta.url)
    const files = (await readdir(directory)).filter((name) => name.endsWith('.spec.ts'))
    const sources = await Promise.all(files.map((name) => readFile(new URL(name, directory), 'utf8')))
    const endpointSources = sources.filter((source) => {
      const id = /^test\('TC(\d+)_API_/m.exec(source)
      return id !== null && Number(id[1]) <= 45
    })
    const covered = endpointSources.flatMap((source) =>
      [...source.matchAll(/test\.step\('TC\d+_((?:get|post|patch|delete)[A-Z][A-Za-z0-9]*)'/g)]
        .map((match) => match[1].toLowerCase()))
    const operationNames = operations.map((operation) => operation.replace(/[^A-Za-z0-9]/g, '').toLowerCase())
    expect(covered).toHaveLength(45)
    expect(new Set(covered).size).toBe(45)
    expect(covered.sort()).toEqual(operationNames.sort())
  })
})
