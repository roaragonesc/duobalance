import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const cwd = fileURLToPath(new URL('../', import.meta.url))
const cli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url))
const output = resolve(cwd, '../test-results/api')
await mkdir(output, { recursive: true })
const blobs = await mkdtemp(resolve(output, 'blobs-'))
let failed = false

// Each shard owns its server/database and stays below the unchanged auth rate limit.
for (let shard = 1; shard <= 4; shard++) {
  const result = spawnSync(process.execPath, [
    cli, 'test', '--config', 'playwright.api.config.ts', `--shard=${shard}/4`,
    '--reporter=list,blob', ...process.argv.slice(2),
  ], {
    cwd, stdio: 'inherit',
    env: {
      ...process.env,
      DUOBALANCE_API_SHARD: String(shard),
      PLAYWRIGHT_BLOB_OUTPUT_FILE: resolve(blobs, `shard-${shard}.zip`),
    },
  })
  if (result.error) throw result.error
  if (result.status !== 0) failed = true
}

const merged = spawnSync(process.execPath, [cli, 'merge-reports', '--reporter=html,junit', blobs], {
  cwd, stdio: 'inherit',
  env: {
    ...process.env,
    PLAYWRIGHT_HTML_OUTPUT_DIR: resolve(cwd, '../playwright-report/api/full-suite'),
    PLAYWRIGHT_HTML_OPEN: 'never',
    PLAYWRIGHT_JUNIT_OUTPUT_FILE: resolve(output, 'junit.xml'),
  },
})
if (merged.error) throw merged.error
if (merged.status !== 0) failed = true
else await rm(blobs, { recursive: true })
process.exitCode = failed ? 1 : 0
