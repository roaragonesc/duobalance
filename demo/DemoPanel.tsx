import { useId, type ChangeEvent } from 'react'
import {
  DEMO_PASSWORD,
  demoUsers,
  resetDemoState,
  updateDemoState,
  useDemoState,
  type DemoUserKey,
} from './demoStore'
import { resetDemoMovements } from './sampleData'

// Floating helper to switch between the mocked users without a backend.
export function DemoPanel() {
  const { user } = useDemoState()
  const selectId = useId()

  function handleUserChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value
    updateDemoState((current) => ({ ...current, user: value ? (value as DemoUserKey) : null }))
    window.location.assign('/')
  }

  function handleReset() {
    resetDemoState()
    resetDemoMovements()
    window.location.reload()
  }

  return (
    <aside
      aria-label="Modo demo"
      className="fixed bottom-4 left-4 z-50 w-64 rounded-xl border-2 border-dashed border-mint bg-white p-3 text-xs text-navy shadow-lg"
    >
      <p className="mb-2 font-bold uppercase tracking-wide">Modo demo · datos ficticios</p>
      <label htmlFor={selectId} className="mb-1 block font-semibold">
        Usuario demo
      </label>
      <select
        id={selectId}
        value={user ?? ''}
        onChange={handleUserChange}
        className="mb-2 w-full rounded-md border border-navy/30 px-2 py-1"
      >
        <option value="">Sin sesión</option>
        {demoUsers.map((demoUser) => (
          <option key={demoUser.key} value={demoUser.key}>
            {demoUser.email} — {demoUser.description}
          </option>
        ))}
      </select>
      <p className="mb-2">
        Contraseña: <code className="font-semibold">{DEMO_PASSWORD}</code>
      </p>
      <p className="mb-2">
        Rocío y Pablo comparten los movimientos guardados en este navegador.
      </p>
      <button
        type="button"
        onClick={handleReset}
        className="w-full rounded-md bg-navy px-2 py-1 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
      >
        Restablecer datos
      </button>
    </aside>
  )
}
