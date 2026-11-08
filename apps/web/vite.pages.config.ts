import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { demoPlugin } from './demo/vitePlugin.ts'

const webRoot = import.meta.dirname

export default defineConfig(({ mode }) => {
  if (mode !== 'pages-demo') throw new Error('Esta configuración requiere --mode pages-demo.')

  return {
    root: webRoot,
    base: '/duobalance/',
    envDir: false,
    define: {
      'import.meta.env.VITE_MOCK_SHARED': JSON.stringify('0'),
      'import.meta.env.VITE_DATA_MODE': JSON.stringify('mock'),
    },
    plugins: [react(), tailwindcss(), demoPlugin()],
    build: { outDir: 'dist-demo', emptyOutDir: true },
  }
})
