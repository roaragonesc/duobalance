import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router'
import EditorShell from '../components/layout/EditorShell'
import RetryPanel from '../components/ui/RetryPanel'
import ExpenseForm from '../features/expenses/components/ExpenseForm'
import {
  getExpense,
  getExpenseErrorMessage,
  saveExpense,
} from '../features/expenses/expenseService'
import type { Expense, ExpenseInput } from '../features/expenses/types'
import type { ExpenseFormValues } from '../features/expenses/validation'
import { useActiveWorkspace } from '../features/spaces/workspaceContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { useMonthParam } from '../hooks/useMonthParam'
import { centsToAmountInput } from '../lib/formValidation'
import { currentMonth, todayIso, type MonthKey } from '../lib/month'

// A new expense opened from a past month starts on that month's first day.
function toFormValues(
  expense: Expense | null,
  month: MonthKey,
): ExpenseFormValues {
  if (!expense) {
    return {
      description: '',
      amount: '',
      date: month === currentMonth() ? todayIso() : `${month}-01`,
      categoryId: '',
      kind: 'shared',
    }
  }
  return {
    description: expense.description,
    amount: centsToAmountInput(expense.amountCents),
    date: expense.date,
    categoryId: expense.categoryId,
    kind: expense.kind,
  }
}

function getSaveErrorMessage(error: unknown) {
  return getExpenseErrorMessage(
    error,
    'No se ha podido guardar el gasto. Inténtalo de nuevo.',
  )
}

// Creates a new expense or, with an :expenseId, edits one of the user's own.
export default function ExpenseEditor() {
  const { expenseId } = useParams()
  const { space } = useActiveWorkspace()
  const navigate = useNavigate()
  const { month } = useMonthParam()
  const isEditing = expenseId !== undefined
  const title = isEditing ? 'Editar gasto' : 'Añadir gasto'

  const load = useCallback(
    () => (expenseId ? getExpense(expenseId) : Promise.resolve(null)),
    [expenseId],
  )
  const { state, reload } = useAsyncData(load)

  async function handleSubmit(input: ExpenseInput) {
    await saveExpense(space.id, input, expenseId)
    const month = input.date.slice(0, 7)
    navigate(month === currentMonth() ? '/expenses' : `/expenses?mes=${month}`)
  }

  let content
  if (state.status === 'loading') {
    content = (
      <p role="status" className="text-[17px] text-navy">
        Cargando gasto…
      </p>
    )
  } else if (state.status === 'error') {
    content = (
      <RetryPanel
        message="No se ha podido cargar el gasto. Inténtalo de nuevo."
        onRetry={reload}
      />
    )
  } else if (isEditing && (!state.data || !state.data.canEdit)) {
    content = (
      <p role="alert" className="text-[16px] text-navy">
        No se ha encontrado el gasto o no tienes permiso para modificarlo.
      </p>
    )
  } else {
    content = (
      <ExpenseForm
        initialValues={toFormValues(state.data, month)}
        submitLabel={isEditing ? 'Guardar cambios' : 'Añadir gasto'}
        kindLocked={isEditing}
        onSubmit={handleSubmit}
        getErrorMessage={getSaveErrorMessage}
      />
    )
  }

  return (
    <EditorShell
      backTo={month === currentMonth() ? '/expenses' : `/expenses?mes=${month}`}
      backLabel="Volver a gastos"
      title={title}
    >
      {content}
    </EditorShell>
  )
}
