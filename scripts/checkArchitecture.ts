import path from 'node:path'
import { run } from './architecture.ts'

const args = process.argv.slice(2)
if (args.some((argument) => argument !== '--write-inventory')) {
  throw new Error('Uso: node scripts/checkArchitecture.ts [--write-inventory]')
}
process.exitCode = run(path.resolve(import.meta.dirname, '..'), args.includes('--write-inventory'))
