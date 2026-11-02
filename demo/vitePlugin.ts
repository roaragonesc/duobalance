// Vite plugin for `npm run dev:demo`: swaps the backend services for the
// in-memory fakes in demo/. Only loaded when mode === 'demo'.
import path from 'node:path'
import type { Plugin } from 'vite'

const demoDir = import.meta.dirname
const srcDir = path.resolve(demoDir, '../src')

const replacements: Record<string, string> = {
  'features/auth/hooks/useAuth.ts': 'useAuth.ts',
  'features/auth/services/authService.ts': 'authService.ts',
  'features/auth/services/profileService.ts': 'profileService.ts',
  'features/spaces/services/spaceService.ts': 'spaceService.ts',
  'features/dashboard/dashboardService.ts': 'dashboardService.ts',
  'features/expenses/expenseService.ts': 'expenseService.ts',
  'features/incomes/incomeService.ts': 'incomeService.ts',
  'features/balance/balanceService.ts': 'balanceService.ts',
}

const normalize = (file: string) => file.replaceAll('\\', '/')

export function demoPlugin(): Plugin {
  return {
    name: 'duobalance-demo',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      // demo/ files may import the real modules (e.g. to re-export helpers).
      if (!importer || normalize(importer).startsWith(normalize(demoDir))) return null
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
      if (!resolved) return null
      const relative = normalize(path.relative(srcDir, resolved.id.split('?')[0]))
      const replacement = replacements[relative]
      return replacement ? path.join(demoDir, replacement) : null
    },
    transformIndexHtml(html) {
      return html.replace('/src/main.tsx', '/demo/main.tsx')
    },
  }
}
