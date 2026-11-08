import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import EditorShell from '../components/layout/EditorShell'
import RetryPanel from '../components/ui/RetryPanel'
import {
  getPendingDebt,
  getSettlementErrorMessage,
  registerSettlement,
} from '../features/balance/balanceService'
import SettlementForm from '../features/balance/components/SettlementForm'
import type { SettlementInput } from '../features/balance/types'
import { useActiveWorkspace } from '../features/spaces/workspaceContext'
import { useAsyncData } from '../hooks/useAsyncData'

/** Consulta la deuda actual y permite registrar un pago manual solo cuando existe saldo pendiente. */
export default function RegisterSettlement() {
  const { space } = useActiveWorkspace()
  const navigate = useNavigate()
  const load = useCallback(() => getPendingDebt(space.id), [space.id])
  const { state, reload } = useAsyncData(load)

  async function handleSubmit(input: SettlementInput) {
    await registerSettlement(space.id, input)
    navigate('/balance')
  }

  let content
  if (state.status === 'loading') {
    content = (
      <p role="status" className="text-[17px] text-navy">
        Cargando deuda pendiente…
      </p>
    )
  } else if (state.status === 'error') {
    content = (
      <RetryPanel message="No se ha podido cargar la deuda pendiente. Inténtalo de nuevo." onRetry={reload} />
    )
  } else if (!state.data || state.data.debtor === null || state.data.amountCents === 0) {
    content = (
      <p role="status" className="text-[16px] text-navy">
        No hay ninguna deuda pendiente que liquidar.
      </p>
    )
  } else {
    content = (
      <SettlementForm
        pending={state.data}
        partnerLabel={space.partnerName ?? 'tu pareja'}
        onSubmit={handleSubmit}
        getErrorMessage={getSettlementErrorMessage}
      />
    )
  }

  return (
    <EditorShell backTo="/balance" backLabel="Volver a balance" title="Registrar liquidación">
      {content}
    </EditorShell>
  )
}