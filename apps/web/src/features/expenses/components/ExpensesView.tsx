import { useState } from 'react'
import EmptyState from '../../../components/ui/EmptyState'
import { FilterSelect } from '../../../components/ui/FormControls'
import PageSkeleton from '../../../components/ui/PageSkeleton'
import RetryPanel from '../../../components/ui/RetryPanel'
import RowActions from '../../../components/ui/RowActions'
import { CardIcon, ScaleIcon, UserIcon, UsersIcon } from '../../../components/ui/icons'
import { IconTile, panelClassName, StatCard } from '../../../components/ui/panel'
import type { AsyncState } from '../../../hooks/useAsyncData'
import { formatCents } from '../../../lib/money'
import { formatShortDate, getMonthName, type MonthKey } from '../../../lib/month'
import { PendingStatus } from '../../dashboard/components/SummaryCards'
import { expenseCategories, getCategory } from '../categories'
import type { Expense, ExpenseKind, ExpenseMonth } from '../types'
import AddExpenseLink from './AddExpenseLink'

type KindFilter = 'all' | ExpenseKind

type ExpensesViewProps = {
  state: AsyncState<ExpenseMonth | null>
  month: MonthKey
  partnerName: string | null
  onRetry: () => void
  onDelete: (expense: Expense) => void
}


/** Identifica visualmente y con texto si el gasto es compartido o individual. */
function KindBadge({ kind }: { kind: ExpenseKind }) {
  const shared = kind === 'shared'
  const Icon = shared ? UsersIcon : UserIcon
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[14px] font-medium ${
        shared ? 'bg-[#E3F8F1] text-[#00704A]' : 'bg-[#F3EAFE] text-[#6B35B8]'
      }`}
    >
      <Icon className="size-4" />
      {shared ? 'Compartido' : 'Individual'}
    </span>
  )
}

/** Fila de gasto con categoría, pagador y acciones disponibles solo para su creador. */
function ExpenseRow({
  expense,
  partnerName,
  onDelete,
}: {
  expense: Expense
  partnerName: string | null
  onDelete: (expense: Expense) => void
}) {
  const category = getCategory(expense.categoryId)
  const CategoryIcon = category.icon
  return (
    <tr className="border-b border-[#E3EEF2] last:border-b-0">
      <td className="py-3.5 pr-4 whitespace-nowrap text-[#56637F]">
        <time dateTime={expense.date}>{formatShortDate(expense.date)}</time>
      </td>
      <th scope="row" className="py-3.5 pr-4 text-left font-semibold">
        <span className="flex items-center gap-3">
          <CategoryIcon className="size-6 shrink-0 text-[#4A5871]" />
          {expense.description}
        </span>
      </th>
      <td className="py-3.5 pr-4">
        <span
          className={`inline-block rounded-full px-3 py-1 text-[14px] font-medium ${category.badgeClassName}`}
        >
          {category.name}
        </span>
      </td>
      <td className="py-3.5 pr-4">
        <KindBadge kind={expense.kind} />
      </td>
      <td className="py-3.5 pr-4">
        {expense.paidBy === 'me' ? 'Tú' : (partnerName ?? 'Tu pareja')}
      </td>
      <td className="py-3.5 pr-4 text-right font-bold whitespace-nowrap">
        {formatCents(expense.amountCents)}
      </td>
      <td className="py-3.5">
        <RowActions
          label={expense.description}
          editTo={`/expenses/${expense.id}/edit`}
          onDelete={() => onDelete(expense)}
          canEdit={expense.canEdit}
          readOnlyNote="Solo quien lo creó puede modificarlo"
        />
      </td>
    </tr>
  )
}


/** Listado mensual de gastos con indicadores, filtros locales, estados y petición de borrado. */
export default function ExpensesView({
  state,
  month,
  partnerName,
  onRetry,
  onDelete,
}: ExpensesViewProps) {
  const [kind, setKind] = useState<KindFilter>('all')
  const [categoryId, setCategoryId] = useState('all')

  if (state.status === 'loading') return <PageSkeleton label="Cargando gastos del mes" />
  if (state.status === 'error') {
    return (
      <RetryPanel
        message="No se han podido cargar los gastos. Inténtalo de nuevo."
        onRetry={onRetry}
      />
    )
  }

  const data = state.data
  if (!data || data.expenses.length === 0) {
    return (
      <EmptyState
        id="expenses-empty-title"
        icon={<CardIcon className="size-7" />}
        title={`Todavía no hay gastos en ${getMonthName(month)}`}
        action={<AddExpenseLink month={month} />}
      >
        Los gastos compartidos los veréis los dos. Los individuales son
        privados y no afectan al balance.
      </EmptyState>
    )
  }

  const visible = data.expenses.filter(
    (expense) =>
      (kind === 'all' || expense.kind === kind) &&
      (categoryId === 'all' || expense.categoryId === categoryId),
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          id="expenses-total"
          label="Total gastos"
          amountCents={data.totalCents}
          icon={
            <IconTile>
              <CardIcon className="size-7" />
            </IconTile>
          }
        />
        <StatCard
          id="expenses-shared"
          label="Compartidos"
          amountCents={data.sharedCents}
          icon={
            <IconTile>
              <UsersIcon className="size-7" />
            </IconTile>
          }
        />
        <StatCard
          id="expenses-individual"
          label="Individuales"
          amountCents={data.individualCents}
          icon={
            <IconTile tone="amber">
              <UserIcon className="size-7" />
            </IconTile>
          }
        />
        <StatCard
          id="expenses-pending"
          label="Saldo pendiente"
          amountCents={data.pending.amountCents}
          icon={
            <IconTile>
              <ScaleIcon className="size-7" />
            </IconTile>
          }
        >
          <PendingStatus pending={data.pending} />
        </StatCard>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="grid flex-1 gap-4 sm:grid-cols-2 md:max-w-[560px]">
          <FilterSelect
            label="Tipo"
            value={kind}
            onChange={(value) => setKind(value as KindFilter)}
          >
            <option value="all">Todos</option>
            <option value="shared">Compartidos</option>
            <option value="individual">Individuales</option>
          </FilterSelect>
          <FilterSelect label="Categoría" value={categoryId} onChange={setCategoryId}>
            <option value="all">Todas</option>
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </FilterSelect>
        </div>
        <div className="md:ml-auto">
          <AddExpenseLink month={month} />
        </div>
      </div>

      <section aria-labelledby="expenses-list-title" className={`p-5 ${panelClassName}`}>
        <h2 id="expenses-list-title" className="sr-only">
          Listado de gastos
        </h2>
        <p role="status" className="sr-only">
          {visible.length === 1 ? '1 gasto' : `${visible.length} gastos`}
        </p>
        {visible.length === 0 ? (
          <p className="py-8 text-center text-[16px] text-[#56637F]">
            No hay gastos con estos filtros.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-[16px] text-navy">
              <caption className="sr-only">Gastos de {getMonthName(month)}</caption>
              <thead>
                <tr className="border-b border-[#E3EEF2] text-left text-[15px] text-[#56637F]">
                  <th scope="col" className="pb-3 font-medium">Fecha</th>
                  <th scope="col" className="pb-3 font-medium">Concepto</th>
                  <th scope="col" className="pb-3 font-medium">Categoría</th>
                  <th scope="col" className="pb-3 font-medium">Tipo</th>
                  <th scope="col" className="pb-3 font-medium">Pagado por</th>
                  <th scope="col" className="pb-3 text-right font-medium">Importe</th>
                  <th scope="col" className="pb-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    partnerName={partnerName}
                    onDelete={onDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
