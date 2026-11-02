import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { demoPlugin } from './demo/vitePlugin.ts'

export default defineConfig(({ mode }) => {
  if (mode !== 'pages-demo') throw new Error('Esta configuración requiere --mode pages-demo.')

  return {
    base: '/duobalance/',
    envDir: false,
    define: {
      'import.meta.env.VITE_MOCK_SHARED': JSON.stringify('0'),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(''),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(''),
    },
    plugins: [react(), tailwindcss(), demoPlugin()],
    build: { outDir: 'dist-demo', emptyOutDir: true },
  }
})
