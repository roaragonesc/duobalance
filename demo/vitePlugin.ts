// Used by development mocks and the explicitly isolated Pages demo build.
import path from 'node:path'
import type { Plugin } from 'vite'

const demoDir = import.meta.dirname
const srcDir = path.resolve(demoDir, '../src')

const replacements: Record<string, string> = {
  'features/auth/components/AuthProvider.tsx': 'authProvider.tsx',
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
    name: 'duobalance-mock',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      // Mock files may import real pure helpers, but their services are never used.
      if (!importer || normalize(importer).startsWith(normalize(demoDir))) return null
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
      if (!resolved) return null
      const relative = normalize(path.relative(srcDir, resolved.id.split('?')[0]))
      const replacement = replacements[relative]
      return replacement ? path.join(demoDir, replacement) : null
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace('/src/main.tsx', '/demo/main.tsx')
      },
    },
  }
}
