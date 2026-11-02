import { useState } from 'react'
import AddLink from '../../../components/ui/AddLink'
import DonutChart from '../../../components/ui/DonutChart'
import EmptyState from '../../../components/ui/EmptyState'
import { FilterSelect } from '../../../components/ui/FormControls'
import PageSkeleton from '../../../components/ui/PageSkeleton'
import RetryPanel from '../../../components/ui/RetryPanel'
import RowActions from '../../../components/ui/RowActions'
import { BriefcaseIcon, UserIcon, UsersIcon, WalletIcon } from '../../../components/ui/icons'
import { IconTile, panelClassName, StatCard } from '../../../components/ui/panel'
import type { AsyncState } from '../../../hooks/useAsyncData'
import { formatCents, formatShare } from '../../../lib/money'
import { formatShortDate, getMonthName, type MonthKey } from '../../../lib/month'
import type { Income, IncomeMonth, IncomeOwner } from '../types'

export const NEW_INCOME_PATH = '/incomes/new'

const MEMBER_COLORS: Record<IncomeOwner, string> = { me: '#2FD3A7', partner: '#3B9CF5' }

type OwnerFilter = 'all' | IncomeOwner

type IncomesViewProps = {
  state: AsyncState<IncomeMonth | null>
  month: MonthKey
  partnerName: string | null
  onRetry: () => void
  onDelete: (income: Income) => void
}

function ContributionShare({ data, partnerLabel }: { data: IncomeMonth; partnerLabel: string }) {
  const members = [
    { id: 'me' as const, name: 'Tú', cents: data.myCents },
    { id: 'partner' as const, name: partnerLabel, cents: data.partnerCents },
  ]
  return (
    <section aria-labelledby="incomes-share-title" className={`p-5 ${panelClassName}`}>
      <h2 id="incomes-share-title" className="text-[16px] font-medium text-[#3E4C63]">
        Reparto de aportaciones
      </h2>
      <div className="mt-3 flex items-center gap-5">
        <DonutChart
          size="sm"
          segments={members.map((member) => ({
            id: member.id,
            color: MEMBER_COLORS[member.id],
            value: member.cents,
          }))}
          total={data.totalCents}
          centerValue={formatShare(data.myCents, data.totalCents)}
          centerLabel="Tú"
        />
        <ul className="space-y-2 text-[15px] text-navy">
          {members.map((member) => (
            <li key={member.id} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: MEMBER_COLORS[member.id] }}
              />
              <span className="font-medium">{member.name}</span>
              <span className="text-[#56637F]">
                {formatShare(member.cents, data.totalCents)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default function IncomesView({
  state,
  month,
  partnerName,
  onRetry,
  onDelete,
}: IncomesViewProps) {
  const [owner, setOwner] = useState<OwnerFilter>('all')
  const partnerLabel = partnerName ?? 'Tu pareja'

  if (state.status === 'loading') return <PageSkeleton label="Cargando ingresos del mes" />
  if (state.status === 'error') {
    return (
      <RetryPanel
        message="No se han podido cargar los ingresos. Inténtalo de nuevo."
        onRetry={onRetry}
      />
    )
  }

  const addLink = <AddLink to={NEW_INCOME_PATH} label="Añadir ingreso" month={month} />
  const data = state.data
  if (!data || data.incomes.length === 0) {
    return (
      <EmptyState
        id="incomes-empty-title"
        icon={<WalletIcon className="size-7" />}
        title={`Todavía no hay ingresos en ${getMonthName(month)}`}
        action={addLink}
      >
        Cada uno registra y gestiona solo sus propios ingresos. Con ellos se
        calcula el reparto cuando es proporcional a los ingresos.
      </EmptyState>
    )
  }

  const visible = data.incomes.filter((income) => owner === 'all' || income.owner === owner)

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          id="incomes-total"
          label="Ingresos totales"
          amountCents={data.totalCents}
          icon={
            <IconTile>
              <WalletIcon className="size-7" />
            </IconTile>
          }
        />
        <StatCard
          id="incomes-mine"
          label="Tus ingresos"
          amountCents={data.myCents}
          icon={
            <IconTile>
              <UserIcon className="size-7" />
            </IconTile>
          }
        >
          {formatShare(data.myCents, data.totalCents)} del total
        </StatCard>
        <StatCard
          id="incomes-partner"
          label={`Ingresos de ${partnerLabel}`}
          amountCents={data.partnerCents}
          icon={
            <IconTile tone="blue">
              <UsersIcon className="size-7" />
            </IconTile>
          }
        >
          {formatShare(data.partnerCents, data.totalCents)} del total
        </StatCard>
        <ContributionShare data={data} partnerLabel={partnerLabel} />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="md:w-[270px]">
          <FilterSelect
            label="Miembro"
            value={owner}
            onChange={(value) => setOwner(value as OwnerFilter)}
          >
            <option value="all">Todos</option>
            <option value="me">Tú</option>
            <option value="partner">{partnerLabel}</option>
          </FilterSelect>
        </div>
        <div className="md:ml-auto">{addLink}</div>
      </div>

      <section aria-labelledby="incomes-list-title" className={`p-5 ${panelClassName}`}>
        <h2 id="incomes-list-title" className="sr-only">
          Listado de ingresos
        </h2>
        <p role="status" className="sr-only">
          {visible.length === 1 ? '1 ingreso' : `${visible.length} ingresos`}
        </p>
        {visible.length === 0 ? (
          <p className="py-8 text-center text-[16px] text-[#56637F]">
            No hay ingresos con este filtro.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[16px] text-navy">
              <caption className="sr-only">Ingresos de {getMonthName(month)}</caption>
              <thead>
                <tr className="border-b border-[#E3EEF2] text-left text-[15px] text-[#56637F]">
                  <th scope="col" className="pb-3 font-medium">Fecha</th>
                  <th scope="col" className="pb-3 font-medium">Concepto</th>
                  <th scope="col" className="pb-3 font-medium">Miembro</th>
                  <th scope="col" className="pb-3 text-right font-medium">Importe</th>
                  <th scope="col" className="pb-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((income) => (
                  <tr key={income.id} className="border-b border-[#E3EEF2] last:border-b-0">
                    <td className="py-3.5 pr-4 whitespace-nowrap text-[#56637F]">
                      <time dateTime={income.date}>{formatShortDate(income.date)}</time>
                    </td>
                    <th scope="row" className="py-3.5 pr-4 text-left font-semibold">
                      <span className="flex items-center gap-3">
                        <BriefcaseIcon className="size-6 shrink-0 text-[#4A5871]" />
                        {income.description}
                      </span>
                    </th>
                    <td className="py-3.5 pr-4">
                      {income.owner === 'me' ? 'Tú' : partnerLabel}
                    </td>
                    <td className="py-3.5 pr-4 text-right font-bold whitespace-nowrap">
                      {formatCents(income.amountCents)}
                    </td>
                    <td className="py-3.5">
                      <RowActions
                        label={income.description}
                        editTo={`/incomes/${income.id}/edit`}
                        onDelete={() => onDelete(income)}
                        canEdit={income.owner === 'me'}
                        readOnlyNote="Solo su titular puede modificarlo"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}