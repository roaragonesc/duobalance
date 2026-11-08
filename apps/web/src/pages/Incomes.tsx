import { useCallback } from 'react'
import MonthPageHeader from '../components/layout/MonthPageHeader'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import StatusMessage from '../components/ui/StatusMessage'
import IncomesView from '../features/incomes/components/IncomesView'
import {
  deleteIncome,
  getIncomeErrorMessage,
  getMonthIncomes,
} from '../features/incomes/incomeService'
import { useActiveWorkspace } from '../features/spaces/workspaceContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { useConfirmDelete } from '../hooks/useConfirmDelete'
import { useMonthParam } from '../hooks/useMonthParam'

export default function Incomes() {
  const { space } = useActiveWorkspace()
  const { month } = useMonthParam()
  const load = useCallback(() => getMonthIncomes(space.id, month), [space.id, month])
  const { state, reload } = useAsyncData(load)
  const removal = useConfirmDelete(
    deleteIncome,
    (error) => getIncomeErrorMessage(error, 'No se ha podido eliminar el ingreso.'),
    reload,
  )

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <MonthPageHeader
        title="Ingresos"
        description="Registra tus ingresos y consulta cómo se reparten las aportaciones."
      />
      <StatusMessage message={removal.notice} className="" />
      <IncomesView
        state={state}
        month={month}
        partnerName={space.partnerName}
        onRetry={reload}
        onDelete={(income) => removal.request({ id: income.id, label: income.description })}
      />
      <ConfirmDialog
        open={removal.target !== null}
        title="¿Eliminar este ingreso?"
        description={
          removal.target
            ? `Se eliminará «${removal.target.label}». Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar ingreso"
        pendingLabel="Eliminando…"
        isPending={removal.isDeleting}
        error={removal.error}
        onConfirm={removal.confirm}
        onCancel={removal.cancel}
      />
    </div>
  )
}