import { useState } from 'react'
import { Link } from 'react-router'
import EmptyState from '../../../components/ui/EmptyState'
import PageSkeleton from '../../../components/ui/PageSkeleton'
import RetryPanel from '../../../components/ui/RetryPanel'
import Tabs from '../../../components/ui/Tabs'
import { primaryActionClassName } from '../../../components/ui/AddLink'
import {
  CheckCircleIcon,
  HistoryIcon,
  ScaleIcon,
  SwapIcon,
  UserIcon,
  UsersIcon,
} from '../../../components/ui/icons'
import { IconTile, panelClassName, StatCard } from '../../../components/ui/panel'
import type { AsyncState } from '../../../hooks/useAsyncData'
import { formatCents } from '../../../lib/money'
import { getMonthName, type MonthKey } from '../../../lib/month'
import { PendingStatus } from '../../dashboard/components/SummaryCards'
import type { PendingBalance } from '../../dashboard/types'
import type { BalanceMonth, Settlement } from '../types'
import { formatShareBasisPoints } from '../validation'
import SettlementsTable from './SettlementsTable'

export const NEW_SETTLEMENT_PATH = '/balance/settle'

type BalanceTab = 'month' | 'history'

type BalanceViewProps = {
  state: AsyncState<BalanceMonth | null>
  history: AsyncState<Settlement[] | null>
  month: MonthKey
  partnerName: string | null
  onRetry: () => void
  onRetryHistory: () => void
}

/** Explica quién debe a quién y ofrece registrar un pago cuando existe deuda pendiente. */
function WhoOwes({ pending, partnerLabel }: { pending: PendingBalance; partnerLabel: string }) {
  const settled = pending.debtor === null || pending.amountCents === 0
  return (
    <section aria-labelledby="who-owes-title" className={`p-6 lg:col-span-7 ${panelClassName}`}>
      <h2 id="who-owes-title" className="text-[21px] font-bold text-navy">
        ¿Quién debe a quién?
      </h2>
      {settled ? (
        <div className="flex flex-col items-center py-8 text-center">
          <IconTile>
            <CheckCircleIcon className="size-7" />
          </IconTile>
          <p className="mt-4 text-[19px] font-bold text-navy">No hay saldos pendientes</p>
          <p className="mt-1 text-[16px] text-[#56637F]">Las cuentas están al día.</p>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <IconTile tone="amber">
              <SwapIcon className="size-7" />
            </IconTile>
            <p className="text-[18px] text-navy">
              <span className="font-bold">
                {pending.debtor === 'me' ? `Tú debes a ${partnerLabel}` : `${partnerLabel} te debe`}
              </span>
              <span className="mt-0.5 block text-[28px] leading-tight font-bold">
                {formatCents(pending.amountCents)}
              </span>
            </p>
          </div>
          <Link to={NEW_SETTLEMENT_PATH} className={primaryActionClassName}>
            Registrar liquidación
          </Link>
        </div>
      )}
    </section>
  )
}

/** Presenta ingresos, gastos compartidos y saldo del mes en una lista de definiciones. */
function MonthSummary({ summary, month }: { summary: BalanceMonth['summary']; month: MonthKey }) {
  const rows = [
    { label: 'Ingresos', value: summary.incomesCents },
    { label: 'Gastos compartidos', value: summary.sharedExpensesCents },
  ]
  return (
    <section aria-labelledby="month-summary-title" className={`p-6 lg:col-span-5 ${panelClassName}`}>
      <h2 id="month-summary-title" className="text-[21px] font-bold text-navy">
        Resumen de {getMonthName(month)}
      </h2>
      <dl className="mt-4 divide-y divide-[#E3EEF2] text-[16px] text-navy">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between py-3">
            <dt className="text-[#56637F]">{row.label}</dt>
            <dd className="font-semibold">{formatCents(row.value)}</dd>
          </div>
        ))}
        <div className="flex justify-between py-3">
          <dt className="font-bold">Saldo del mes</dt>
          <dd className="text-[19px] font-bold">{formatCents(summary.remainingCents)}</dd>
        </div>
      </dl>
    </section>
  )
}

/** Compone el balance mensual y las pestañas de liquidaciones, con estados de carga, error y ausencia de datos. */
export default function BalanceView({
  state,
  history,
  month,
  partnerName,
  onRetry,
  onRetryHistory,
}: BalanceViewProps) {
  const [tab, setTab] = useState<BalanceTab>('month')
  const partnerLabel = partnerName ?? 'Tu pareja'

  if (state.status === 'loading') return <PageSkeleton label="Cargando balance" />
  if (state.status === 'error') {
    return (
      <RetryPanel message="No se ha podido cargar el balance. Inténtalo de nuevo." onRetry={onRetry} />
    )
  }
  const data = state.data
  if (!data) {
    return (
      <EmptyState
        id="balance-empty-title"
        icon={<ScaleIcon className="size-7" />}
        title={`Todavía no hay balance en ${getMonthName(month)}`}
      >
        El balance se calcula con los gastos compartidos, el reparto del espacio
        y las liquidaciones registradas.
      </EmptyState>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          id="balance-month"
          label="Saldo del mes"
          amountCents={data.month.amountCents}
          icon={
            <IconTile>
              <ScaleIcon className="size-7" />
            </IconTile>
          }
        >
          <PendingStatus pending={data.month} />
        </StatCard>
        <StatCard
          id="balance-accumulated"
          label="Saldo acumulado"
          amountCents={data.accumulated.amountCents}
          icon={
            <IconTile tone="amber">
              <HistoryIcon className="size-7" />
            </IconTile>
          }
        >
          <PendingStatus pending={data.accumulated} />
        </StatCard>
        <StatCard
          id="balance-me"
          label="Tu aportación"
          amountCents={data.members.me.contributionCents}
          icon={
            <IconTile>
              <UserIcon className="size-7" />
            </IconTile>
          }
        >
          Aporta el {formatShareBasisPoints(data.members.me.shareBasisPoints)}
        </StatCard>
        <StatCard
          id="balance-partner"
          label={`Aportación de ${partnerLabel}`}
          amountCents={data.members.partner.contributionCents}
          icon={
            <IconTile tone="blue">
              <UsersIcon className="size-7" />
            </IconTile>
          }
        >
          Aporta el {formatShareBasisPoints(data.members.partner.shareBasisPoints)}
        </StatCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <WhoOwes pending={data.accumulated} partnerLabel={partnerLabel} />
        <MonthSummary summary={data.summary} month={month} />
      </div>

      <section aria-label="Liquidaciones" className={`p-5 ${panelClassName}`}>
        <Tabs
          label="Liquidaciones"
          tabs={[
            { id: 'month', label: 'Liquidaciones' },
            { id: 'history', label: 'Historial' },
          ]}
          selected={tab}
          onSelect={setTab}
        >
          {tab === 'month' ? (
            <SettlementsTable
              state={{ status: 'ready', data: data.settlements }}
              caption={`Liquidaciones de ${getMonthName(month)}`}
              emptyMessage={`No hay liquidaciones en ${getMonthName(month)}.`}
              partnerLabel={partnerLabel}
              onRetry={onRetry}
            />
          ) : (
            <SettlementsTable
              state={history}
              caption="Historial de liquidaciones"
              emptyMessage="Todavía no habéis registrado ninguna liquidación."
              partnerLabel={partnerLabel}
              showYear
              onRetry={onRetryHistory}
            />
          )}
        </Tabs>
      </section>
    </div>
  )
}