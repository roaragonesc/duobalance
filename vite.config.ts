import { defineConfig } from 'vite'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { demoPlugin } from './demo/vitePlugin.ts'
import { sharedMockServer } from './demo/sharedServer.ts'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const configuredMode = env.VITE_DATA_MODE
  const dataMode = configuredMode || (command === 'serve' ? 'mock' : 'supabase')
  if (mode === 'demo' && dataMode !== 'mock') {
    throw new Error('El modo demo requiere VITE_DATA_MODE=mock y no permite conectar a Supabase.')
  }
  if (dataMode !== 'mock' && dataMode !== 'supabase') {
    throw new Error('VITE_DATA_MODE debe ser "mock" o "supabase".')
  }
  if (command === 'build' && dataMode === 'mock') {
    throw new Error('El modo mock solo está disponible con el servidor de desarrollo.')
  }
  const useMocks = command === 'serve' && dataMode === 'mock'

  return {
    plugins: [
      react(), tailwindcss(),
      ...(useMocks ? [demoPlugin()] : []),
      ...(useMocks && env.VITE_MOCK_SHARED === '1' ? [sharedMockServer()] : []),
    ],
    // Same origin as the Supabase Site URL; the PKCE verifier is stored per origin.
    server: { host: 'localhost', port: 5173, strictPort: true },
  }
})