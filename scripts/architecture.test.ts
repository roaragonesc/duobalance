import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { analyze, checkInventory, collectFiles, inventoryRows, updateInventory } from './architecture.ts'

const emptyInventory = '# Inventario\n<!-- inventory:generated:start -->\n<!-- inventory:generated:end -->\nTexto manual.\n'

function fixture(files: Record<string, string>, execute: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), 'duobalance-architecture-test-'))
  try {
    for (const [file, content] of Object.entries(files)) {
      const target = path.join(root, file)
      mkdirSync(path.dirname(target), { recursive: true })
      writeFileSync(target, content)
    }
    execute(root)
  } finally {
    rmSync(root, { recursive: true })
  }
}

test('AST: imports, reexports, dynamic literals, require and import types; no string/comment false positives', () => {
  fixture({
    'apps/web/src/a.ts': `// import '../missing'
      const example = "import '../missing'";
      export { value } from './b.js';
      import type { Value } from './b.js';
      type Other = import('./b.js').Value;
      import('./b.js'); require(\`./b.js\`);
      export const literal = example;`,
    'apps/web/src/b.ts': 'export const value = 1; export type Value = number',
  }, (root) => {
    const result = analyze(root)
    assert.deepEqual(result.violations, [])
    assert.deepEqual(result.entries.find((entry) => entry.file.endsWith('/a.ts'))?.dependencies, ['apps/web/src/b.ts'])
    assert.deepEqual(result.entries.find((entry) => entry.file.endsWith('/b.ts'))?.consumers, ['apps/web/src/a.ts'])
  })
})

test('inventory update preserves manual content and tracks every source exactly once', () => {
  fixture({ 'apps/web/src/a.tsx': 'export default function A() { return <main /> }' }, (root) => {
    const { entries } = analyze(root)
    const updated = updateInventory(entries, emptyInventory)
    assert.ok(updated.endsWith('Texto manual.\n'))
    assert.deepEqual(checkInventory(entries, updated), [])
    assert.deepEqual(checkInventory(entries, updated.replaceAll('\n', '\r\n')), [])
    const drift = updated.replace('Web / a.tsx', 'Web / incorrect-owner')
    assert.equal(checkInventory(entries, drift)[0].rule, 'inventory-drift')
    assert.deepEqual(entries[0].exports, ['A', 'default'])
    assert.deepEqual(inventoryRows(updated), ['apps/web/src/a.tsx'])
    const missing = checkInventory(entries, emptyInventory)
    assert.equal(missing[0].rule, 'inventory-missing')
    assert.equal(checkInventory([], updated)[0].rule, 'inventory-orphan')
    const duplicate = updated.replace('<!-- inventory:generated:end -->', '| `apps/web/src/a.tsx` | duplicate |\n<!-- inventory:generated:end -->')
    assert.equal(checkInventory(entries, duplicate)[0].rule, 'inventory-duplicate')
  })
})

test('inventory refuses missing or duplicate markers', () => {
  assert.throws(() => inventoryRows('no markers'), /único bloque/)
  assert.throws(() => inventoryRows(emptyInventory + '<!-- inventory:generated:start -->'), /único bloque/)
})

test('generated sources, build artifacts and node_modules are excluded explicitly', () => {
  fixture({
    'apps/web/src/a.ts': 'export const a = 1',
    'apps/web/src/node_modules/hidden.ts': 'dependency',
    'apps/web/demo/dist-demo/hidden.ts': 'generated',
    'apps/api/src/dist/hidden.ts': 'generated',
    'apps/web/src/styles/index.css': 'main {}',
    'shared/mockData.json': '{}',
  }, (root) => assert.deepEqual(collectFiles(root), ['apps/web/src/a.ts', 'apps/web/src/styles/index.css', 'shared/mockData.json']))
})

const sharedManifest = JSON.stringify({
  name: '@duobalance/shared-types',
  exports: { '.': { types: './index.d.ts' } },
})

const invalidCases: { name: string; rule: string; files: Record<string, string> }[] = [
  { name: 'browser application cannot import developer tests', rule: 'developer-test-boundary', files: {
    'apps/web/src/a.ts': "export * from '../tests/a.js'",
    'apps/web/tests/a.ts': 'export const a = 1',
  } },
  { name: 'API application cannot import developer tests', rule: 'developer-test-boundary', files: {
    'apps/api/src/a.ts': "export * from '../tests/a.js'",
    'apps/api/tests/a.ts': 'export const a = 1',
  } },
  { name: 'demo cannot import developer tests', rule: 'developer-test-boundary', files: {
    'apps/web/demo/a.ts': "export * from '../tests/a.js'",
    'apps/web/tests/a.ts': 'export const a = 1',
  } },
  { name: 'frontend cannot import backend even through a reexport', rule: 'workspace-boundary', files: {
    'apps/web/src/a.ts': "export * from '../../api/src/server.js'",
    'apps/api/src/server.ts': 'export const secret = 1',
  } },
  { name: 'backend cannot import frontend using require', rule: 'workspace-boundary', files: {
    'apps/api/src/a.ts': "const a = require('../../web/src/a.js')",
    'apps/web/src/a.ts': 'export const a = 1',
  } },
  { name: 'dynamic imports respect workspace boundaries', rule: 'workspace-boundary', files: {
    'apps/web/src/a.ts': "import('../../api/src/a.js')",
    'apps/api/src/a.ts': 'export const a = 1',
  } },
  { name: 'cycles include type dependencies', rule: 'dependency-cycle', files: {
    'apps/web/src/a.ts': "export type { B } from './b.js'; export type A = string",
    'apps/web/src/b.ts': "export type { A } from './a.js'; export type B = string",
  } },
  { name: 'self imports are cycles', rule: 'dependency-cycle', files: {
    'apps/web/src/a.ts': "import './a.js'",
  } },
  { name: 'broken imports fail rather than silently disappearing', rule: 'unresolved-import', files: {
    'apps/web/src/a.ts': "import './missing.js'",
  } },
  { name: 'shared packages cannot depend on server runtime', rule: 'shared-safe', files: {
    'packages/shared-types/package.json': sharedManifest,
    'packages/shared-types/index.d.ts': "import type { Stats } from 'node:fs'; export type S = Stats",
  } },
  { name: 'package-private subpaths are rejected', rule: 'public-import', files: {
    'apps/web/src/a.ts': "import type { Secret } from '@duobalance/shared-types/private'",
    'packages/shared-types/package.json': sharedManifest,
    'packages/shared-types/index.d.ts': 'export type Public = string',
    'packages/shared-types/private.d.ts': 'export type Secret = string',
  } },
  { name: 'relative package-private imports are rejected', rule: 'public-import', files: {
    'apps/web/src/a.ts': "import type { Secret } from '../../../packages/shared-types/private'",
    'packages/shared-types/package.json': sharedManifest,
    'packages/shared-types/index.d.ts': 'export type Public = string',
    'packages/shared-types/private.d.ts': 'export type Secret = string',
  } },
  { name: 'API services cannot depend on HTTP controllers', rule: 'api-layer', files: {
    'apps/api/src/services/a.ts': "export { a } from '../controllers/a.js'",
    'apps/api/src/controllers/a.ts': 'export const a = 1',
  } },
  { name: 'feature code cannot depend on page composition', rule: 'web-composition', files: {
    'apps/web/src/features/auth/a.ts': "export { a } from '../../pages/a.js'",
    'apps/web/src/pages/a.ts': 'export const a = 1',
  } },
  { name: 'syntax errors cannot pass architecture checks', rule: 'syntax', files: {
    'apps/web/src/a.ts': 'export const = ;',
  } },
  { name: 'tsconfig aliases cannot bypass frontend/backend boundary', rule: 'workspace-boundary', files: {
    'apps/web/tsconfig.app.json': JSON.stringify({ compilerOptions: { paths: { '@server/*': ['../api/src/*'] } }, include: ['src'] }),
    'apps/web/src/a.ts': "import { a } from '@server/a'",
    'apps/api/src/a.ts': 'export const a = 1',
  } },
  { name: 'application package names cannot bypass boundaries', rule: 'workspace-boundary', files: {
    'apps/web/src/a.ts': "import { a } from '@duobalance/api/private'",
    'apps/api/package.json': '{"name":"@duobalance/api"}',
    'apps/api/src/a.ts': 'export const a = 1',
  } },
  { name: 'browser sources cannot import server dependencies', rule: 'shared-safe', files: {
    'apps/web/src/a.ts': "import fs from 'node:fs'",
  } },
]

test('developer tests are inventoried and may consume their own application and Node runner', () => {
  fixture({
    'apps/web/src/a.ts': 'export const a = 1',
    'apps/web/tests/a.test.ts': "import test from 'node:test'; import { a } from '../src/a.js'; test('a', () => a)",
    'apps/api/src/a.ts': 'export const a = 1',
    'apps/api/tests/a.test.ts': "import test from 'node:test'; import { a } from '../src/a.js'; test('a', () => a)",
  }, (root) => {
    const { entries, violations } = analyze(root)
    assert.deepEqual(violations, [])
    assert.equal(entries.filter((entry) => entry.file.includes('/tests/')).length, 2)
    assert.deepEqual(checkInventory(entries, updateInventory(entries, emptyInventory)), [])
  })
})

for (const { name, rule, files } of invalidCases) {
  test(name, () => fixture(files, (root) => {
    const { violations } = analyze(root)
    assert.ok(violations.some((violation) => violation.rule === rule), JSON.stringify(violations))
    const finding = violations.find((violation) => violation.rule === rule)
    assert.ok(finding?.file)
    assert.ok(finding?.suggestion)
  }))
}

test('public package imports and legitimate internal imports pass', () => {
  fixture({
    'apps/web/src/a.ts': "import type { Public } from '@duobalance/shared-types'; import './internal'",
    'apps/web/src/internal.ts': 'export const internal = 1',
    'packages/shared-types/package.json': sharedManifest,
    'packages/shared-types/index.d.ts': 'export type Public = string',
  }, (root) => {
    const result = analyze(root)
    assert.deepEqual(result.violations, [])
    assert.ok(result.entries.find((entry) => entry.file === 'apps/web/src/a.ts')?.dependencies.includes('packages/shared-types/index.d.ts'))
  })

})

test('public navigation metadata and imported image resources are legitimate', () => {
  fixture({
    'apps/web/src/components/layout/Layout.ts': "export { appScreens } from '../../app/router/screens'; import '../../assets/logo.png'",
    'apps/web/src/app/router/screens.ts': "export const appScreens = []",
    'apps/web/src/assets/logo.png': 'fictitious binary placeholder; not parsed',
  }, (root) => assert.deepEqual(analyze(root).violations, []))
})

test('destructured exports expose binding names, not property names or initializers', () => {
  fixture({ 'apps/web/src/a.ts': "const source = { original: 1 }; export const { original: alias } = source" },
    (root) => assert.deepEqual(analyze(root).entries[0].exports, ['alias']))
})

test('CLI exits nonzero for violations and zero for valid inventory', () => {
  fixture({ 'apps/web/src/a.ts': 'export const a = 1', 'docs/COMPONENT_INVENTORY.md': emptyInventory }, (root) => {
    const architectureModule = new URL('./architecture.ts', import.meta.url).href
    const execute = (write: boolean) => spawnSync(process.execPath, [
      '--input-type=module', '-e',
      `import {run} from ${JSON.stringify(architectureModule)}; process.exitCode = run(${JSON.stringify(root)}, ${write});`,
    ], { encoding: 'utf8' })
    const failed = execute(false)
    assert.equal(failed.status, 1, failed.stderr)
    assert.match(failed.stderr, /inventory-missing/)
    assert.equal(execute(true).status, 0)
    assert.equal(execute(false).status, 0)
    assert.ok(readFileSync(path.join(root, 'docs', 'COMPONENT_INVENTORY.md'), 'utf8').includes('apps/web/src/a.ts'))
  })
})
