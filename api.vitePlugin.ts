import path from 'node:path'
import type { Plugin } from 'vite'

const source = path.resolve(import.meta.dirname, 'src')
const replacements: Record<string, string> = {
  'features/auth/components/AuthProvider.tsx': 'AuthProvider.tsx',
  'features/auth/services/authService.ts': 'authService.ts',
  'features/auth/services/profileService.ts': 'profileService.ts',
  'features/spaces/services/spaceService.ts': 'spaceService.ts',
  'features/expenses/expenseService.ts': 'expenseService.ts',
  'features/incomes/incomeService.ts': 'incomeService.ts',
  'features/balance/balanceService.ts': 'balanceService.ts',
  'features/dashboard/dashboardService.ts': 'dashboardService.ts',
}
export function apiPlugin(): Plugin {
  return {
    name: 'duobalance-api', enforce: 'pre',
    async resolveId(id, importer, options) {
      if (!importer || importer.replaceAll('\\', '/').includes('/src/api/')) return null
      const resolved = await this.resolve(id, importer, { ...options, skipSelf: true })
      if (!resolved) return null
      const replacement = replacements[path.relative(source, resolved.id.split('?')[0]).replaceAll('\\', '/')]
      return replacement ? path.join(source, 'api', replacement) : null
    },
  }
}
