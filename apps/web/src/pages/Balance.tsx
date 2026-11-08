import { useCallback } from 'react'
import MonthPageHeader from '../components/layout/MonthPageHeader'
import BalanceView from '../features/balance/components/BalanceView'
import { getMonthBalance, getSettlementHistory } from '../features/balance/balanceService'
import { useActiveWorkspace } from '../features/spaces/workspaceContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { useMonthParam } from '../hooks/useMonthParam'

/** Carga balance mensual e historial del espacio y los entrega a la vista con reintentos independientes. */
export default function Balance() {
  const { space } = useActiveWorkspace()
  const { month } = useMonthParam()
  const loadMonth = useCallback(() => getMonthBalance(space.id, month), [space.id, month])
  const loadHistory = useCallback(() => getSettlementHistory(space.id), [space.id])
  const balance = useAsyncData(loadMonth)
  const history = useAsyncData(loadHistory)

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <MonthPageHeader
        title="Balance"
        description="Consulta quién debe a quién y registra las liquidaciones."
      />
      <BalanceView
        state={balance.state}
        history={history.state}
        month={month}
        partnerName={space.partnerName}
        onRetry={balance.reload}
        onRetryHistory={history.reload}
      />
    </div>
  )
}