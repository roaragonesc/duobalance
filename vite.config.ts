import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { demoPlugin } from './demo/vitePlugin.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // `npm run dev:demo` swaps the backend for mocked users (see demo/).
  const isDemo = mode === 'demo'
  return {
    plugins: [react(), tailwindcss(), ...(isDemo ? [demoPlugin()] : [])],
    // Same origin as the Supabase Site URL; the PKCE verifier is stored per origin.
    server: { host: 'localhost', port: isDemo ? 5174 : 5173, strictPort: true },
  }
})