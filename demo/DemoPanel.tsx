import { useId, useState, type ChangeEvent } from 'react'
import { beginPasswordReset } from './authService'
import {
  DEMO_PASSWORD,
  resetDemoState,
  setDemoUser,
  useDemoState,
  type DemoAccount,
} from './demoStore'
import { resetDemoMovements } from './sampleData'

function confirmationUrl(token: string, next: string | null): string {
  const url = new URL('/auth/callback', window.location.origin)
  url.searchParams.set('token_hash', token)
  url.searchParams.set('type', 'signup')
  if (next) url.searchParams.set('next', next)
  return url.toString()
}

export function DemoPanel() {
  const { user, users } = useDemoState()
  const selectId = useId()
  const contentId = useId()
  const [expanded, setExpanded] = useState(true)
  const accounts = Object.values(users)
  const pendingConfirmations = accounts.filter(
    (account): account is DemoAccount & { confirmationToken: string } =>
      account.confirmationToken !== null,
  )
  const pendingRecoveries = accounts.filter(
    (account): account is DemoAccount & { passwordResetToken: string } =>
      account.passwordResetToken !== null,
  )

  function handleUserChange(event: ChangeEvent<HTMLSelectElement>) {
    setDemoUser(event.target.value || null)
    window.location.assign('/')
  }

  async function handleReset() {
    try {
      await resetDemoState()
      await resetDemoMovements()
      window.location.assign('/login')
    } catch (error) {
      console.error('No se pudieron restablecer los datos mock.', error)
      window.alert('No se pudieron restablecer los datos mock. Recarga e inténtalo de nuevo.')
    }
  }

  function handlePasswordReset(token: string) {
    window.location.assign(beginPasswordReset(token))
  }

  return (
    <aside
      aria-label="Modo mock de desarrollo"
      className={`fixed right-4 bottom-4 z-50 max-h-[45vh] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border-2 border-dashed border-mint bg-white p-3 text-xs text-navy shadow-lg ${expanded ? 'w-72' : 'w-auto'}`}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => setExpanded(!expanded)}
        className="rounded-md font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
      >
        {expanded ? 'Ocultar panel mock' : 'Mostrar panel mock'}
      </button>
      <div id={contentId} hidden={!expanded}>
        <p className="my-2 font-bold uppercase tracking-wide">Modo mock · solo desarrollo</p>
        <label htmlFor={selectId} className="mb-1 block font-semibold">
          Usuario de prueba
        </label>
        <select
          id={selectId}
          value={user ?? ''}
          onChange={handleUserChange}
          className="mb-2 w-full rounded-md border border-navy/30 px-2 py-1"
        >
          <option value="">Sin sesión</option>
          {accounts.map((account) => (
            <option key={account.key} value={account.key}>
              {account.email} — {account.description}
            </option>
          ))}
        </select>
        <p className="mb-2">
          Contraseña de usuarios de prueba: <code className="font-semibold">{DEMO_PASSWORD}</code>
        </p>
        <p className="mb-2">
          Rocío y Pablo comparten los movimientos. Las cuentas Inés y Mateo están disponibles para
          invitaciones.
        </p>
        {pendingConfirmations.length > 0 && (
          <section aria-label="Confirmaciones mock" className="mb-2 border-t border-navy/15 pt-2">
            <p className="mb-1 font-semibold">Correos simulados</p>
            {pendingConfirmations.map((account) => (
              <a
                key={account.key}
                href={confirmationUrl(account.confirmationToken, account.confirmationNext)}
                className="mb-1 block break-all text-blue-800 underline"
              >
                Confirmar correo de {account.email}
              </a>
            ))}
          </section>
        )}
        {pendingRecoveries.length > 0 && (
          <section aria-label="Recuperaciones mock" className="mb-2 border-t border-navy/15 pt-2">
            <p className="mb-1 font-semibold">Recuperaciones simuladas</p>
            {pendingRecoveries.map((account) => (
              <button
                key={account.key}
                type="button"
                onClick={() => handlePasswordReset(account.passwordResetToken)}
                className="mb-1 block text-left text-blue-800 underline"
              >
                Abrir recuperación de {account.email}
              </button>
            ))}
          </section>
        )}
        <button
          type="button"
          onClick={handleReset}
          className="w-full rounded-md bg-navy px-2 py-1 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
        >
          Restablecer datos de prueba
        </button>
      </div>
    </aside>
  )
}
