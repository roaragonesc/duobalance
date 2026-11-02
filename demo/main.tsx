// Entry point used only by `npm run dev:demo` (see vite.config.ts).
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/index.css'
import App from '../src/App.tsx'
import { DemoPanel } from './DemoPanel'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <DemoPanel />
  </StrictMode>,
)
