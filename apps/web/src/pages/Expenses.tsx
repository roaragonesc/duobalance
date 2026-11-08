import { useCallback } from 'react'

import ConfirmDialog from '../components/ui/ConfirmDialog'
import MonthPageHeader from '../components/layout/MonthPageHeader'
import StatusMessage from '../components/ui/StatusMessage'
import ExpensesView from '../features/expenses/components/ExpensesView'
import {
  deleteExpense,
  getExpenseErrorMessage,
  getMonthExpenses,
} from '../features/expenses/expenseService'
import type { Expense } from '../features/expenses/types'
import { useActiveWorkspace } from '../features/spaces/workspaceContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { useConfirmDelete } from '../hooks/useConfirmDelete'
import { useMonthParam } from '../hooks/useMonthParam'

/** Carga los gastos mensuales y coordina su borrado confirmado, recarga y mensajes de resultado. */
export default function Expenses() {
  const { space } = useActiveWorkspace()
  const { month } = useMonthParam()
  const load = useCallback(
    () => getMonthExpenses(space.id, month),
    [space.id, month],
  )
  const { state, reload } = useAsyncData(load)

  const removal = useConfirmDelete<{ id: string; label: string }>(
    deleteExpense,
    (error) => getExpenseErrorMessage(error, 'No se ha podido eliminar el gasto.'),
    reload,
  )

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <MonthPageHeader
        title="Gastos"
        description="Añade, consulta y gestiona todos los gastos de vuestro espacio."
      />
      <StatusMessage message={removal.notice} className="" />
      <ExpensesView
        state={state}
        month={month}
        partnerName={space.partnerName}
        onRetry={reload}
        onDelete={(expense: Expense) =>
          removal.request({ id: expense.id, label: expense.description })
        }
      />
      <ConfirmDialog
        open={removal.target !== null}
        title="¿Eliminar este gasto?"
        description={
          removal.target
            ? `Se eliminará «${removal.target.label}». Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar gasto"
        pendingLabel="Eliminando…"
        isPending={removal.isDeleting}
        error={removal.error}
        onConfirm={removal.confirm}
        onCancel={removal.cancel}
      />
    </div>
  )
}
