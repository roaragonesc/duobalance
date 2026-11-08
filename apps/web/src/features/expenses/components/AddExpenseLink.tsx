import AddLink from '../../../components/ui/AddLink'
import type { MonthKey } from '../../../lib/month'

export const NEW_EXPENSE_PATH = '/expenses/new'

/** Abre la creación de un gasto manteniendo el mes que está consultando el usuario. */
export default function AddExpenseLink({ month }: { month: MonthKey }) {
  return <AddLink to={NEW_EXPENSE_PATH} label="Añadir gasto" month={month} />
}