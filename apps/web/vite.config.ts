import path from 'node:path'
import { defineConfig } from 'vite'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { demoPlugin } from './demo/vitePlugin.ts'
import { sharedMockServer } from './demo/sharedServer.ts'

const webRoot = import.meta.dirname
const repositoryRoot = path.resolve(webRoot, '../..')

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, repositoryRoot, 'VITE_')
  const configuredMode = env.VITE_DATA_MODE
  const dataMode = configuredMode || (command === 'serve' ? 'mock' : 'api')
  if (mode === 'demo' && dataMode !== 'mock') {
    throw new Error('El modo demo requiere VITE_DATA_MODE=mock y no permite conectar servicios externos.')
  }
  if (dataMode !== 'mock' && dataMode !== 'api') {
    throw new Error('VITE_DATA_MODE debe ser "mock" o "api".')
  }
  if (command === 'build' && dataMode === 'mock') {
    throw new Error('El modo mock solo está disponible con el servidor de desarrollo.')
  }
  const useMocks = command === 'serve' && dataMode === 'mock'

  return {
    root: webRoot,
    envDir: repositoryRoot,
    define: { 'import.meta.env.VITE_DATA_MODE': JSON.stringify(dataMode) },
    plugins: [
      react(), tailwindcss(),
      ...(useMocks ? [demoPlugin()] : []),
      ...(useMocks && env.VITE_MOCK_SHARED === '1' ? [sharedMockServer()] : []),
    ],
    // Keep browser sessions on the same origin as the API proxy.
    server: { host: 'localhost', port: 5173, strictPort: true,
      ...(dataMode === 'api' ? { proxy: { '/api': { target: env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3001' } } } : {}),
    },
  }
})