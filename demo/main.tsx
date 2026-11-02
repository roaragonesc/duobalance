// Entry point used only when `VITE_DATA_MODE=mock` in development.
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
