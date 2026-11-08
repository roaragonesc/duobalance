import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router'
import EditorShell from '../components/layout/EditorShell'
import RetryPanel from '../components/ui/RetryPanel'
import IncomeForm from '../features/incomes/components/IncomeForm'
import {
  getIncomeErrorMessage,
  getOwnIncome,
  saveIncome,
} from '../features/incomes/incomeService'
import type { Income, IncomeInput } from '../features/incomes/types'
import type { IncomeFormValues } from '../features/incomes/validation'
import { useActiveWorkspace } from '../features/spaces/workspaceContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { useMonthParam } from '../hooks/useMonthParam'
import { centsToAmountInput } from '../lib/formValidation'
import { currentMonth, todayIso, type MonthKey } from '../lib/month'

function incomesPath(month: MonthKey) {
  return month === currentMonth() ? '/incomes' : `/incomes?mes=${month}`
}

function toFormValues(income: Income | null, month: MonthKey): IncomeFormValues {
  if (!income) {
    return {
      description: '',
      amount: '',
      date: month === currentMonth() ? todayIso() : `${month}-01`,
    }
  }
  return {
    description: income.description,
    amount: centsToAmountInput(income.amountCents),
    date: income.date,
  }
}

function getSaveErrorMessage(error: unknown) {
  return getIncomeErrorMessage(error, 'No se ha podido guardar el ingreso. Inténtalo de nuevo.')
}

/** Crea o edita un ingreso propio y vuelve al listado del mes correspondiente a su fecha. */
export default function IncomeEditor() {
  const { incomeId } = useParams()
  const { space } = useActiveWorkspace()
  const navigate = useNavigate()
  const { month } = useMonthParam()
  const isEditing = incomeId !== undefined
  const title = isEditing ? 'Editar ingreso' : 'Añadir ingreso'

  const load = useCallback(
    () => (incomeId ? getOwnIncome(incomeId) : Promise.resolve(null)),
    [incomeId],
  )
  const { state, reload } = useAsyncData(load)

  async function handleSubmit(input: IncomeInput) {
    await saveIncome(space.id, input, incomeId)
    navigate(incomesPath(input.date.slice(0, 7)))
  }

  let content
  if (state.status === 'loading') {
    content = (
      <p role="status" className="text-[17px] text-navy">
        Cargando ingreso…
      </p>
    )
  } else if (state.status === 'error') {
    content = (
      <RetryPanel message="No se ha podido cargar el ingreso. Inténtalo de nuevo." onRetry={reload} />
    )
  } else if (isEditing && (!state.data || state.data.owner !== 'me')) {
    content = (
      <p role="alert" className="text-[16px] text-navy">
        No se ha encontrado el ingreso o no tienes permiso para modificarlo.
      </p>
    )
  } else {
    content = (
      <IncomeForm
        initialValues={toFormValues(state.data, month)}
        submitLabel={isEditing ? 'Guardar cambios' : 'Añadir ingreso'}
        onSubmit={handleSubmit}
        getErrorMessage={getSaveErrorMessage}
      />
    )
  }

  return (
    <EditorShell backTo={incomesPath(month)} backLabel="Volver a ingresos" title={title}>
      {content}
    </EditorShell>
  )
}