// Entry point used only when `VITE_DATA_MODE=mock` in development.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/styles/index.css'
import App from '../src/app/App.tsx'
import { DemoPanel } from './DemoPanel'
import { syncSharedMock } from './sharedClient'

/** Prepara el almacenamiento ficticio y monta app/panel de demo, mostrando fallos de inicialización. */
async function start() {
  const root = createRoot(document.getElementById('root')!)
  try {
    await syncSharedMock()
    root.render(
      <StrictMode>
        <App />
        <DemoPanel />
      </StrictMode>,
    )
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.debug('Inicio mock cancelado al abandonar la página.')
      return
    }
    console.error('No se pudo iniciar el almacenamiento mock.', error)
    root.render(<p role="alert">No se pudo iniciar el modo mock. Recarga la página para reintentar.</p>)
  }
}

void start()
