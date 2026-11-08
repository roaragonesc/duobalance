import {
  ArrowDownIcon,
  ArrowUpIcon,
  CardIcon,
  CheckCircleIcon,
  ScaleIcon,
  UserIcon,
} from '../../../components/ui/icons'
import { formatShare } from '../../../lib/money'
import { getMonthName, shiftMonth, type MonthKey } from '../../../lib/month'
import type { DashboardSummary, PendingBalance } from '../types'
import { IconTile, StatCard } from '../../../components/ui/panel'

/** Compara el gasto con el mes anterior cuando existen datos de referencia. */
function MonthComparison({
  totalCents,
  previousCents,
  month,
}: {
  totalCents: number
  previousCents: number | null
  month: MonthKey
}) {
  if (!previousCents) return null
  const previousName = getMonthName(shiftMonth(month, -1))
  const change = Math.round(((totalCents - previousCents) * 100) / previousCents)
  if (change === 0) return <p>Igual que {previousName}</p>
  const Arrow = change > 0 ? ArrowUpIcon : ArrowDownIcon
  return (
    <p className="flex items-center gap-1 text-[#007A4D]">
      <Arrow className="size-4" />
      {`${change > 0 ? '+' : ''}${change}% vs. ${previousName}`}
    </p>
  )
}

/** Describe si las cuentas están al día o qué miembro tiene deuda pendiente. */
export function PendingStatus({ pending }: { pending: PendingBalance }) {
  if (pending.debtor === null || pending.amountCents === 0) {
    return (
      <p className="flex items-center gap-2 font-semibold text-[#007A4D]">
        <CheckCircleIcon className="size-5" />
        Todo al día
      </p>
    )
  }
  return (
    <p className="font-semibold text-[#9A4B00]">
      {pending.debtor === 'me' ? 'Debes a tu pareja' : 'Tu pareja te debe'}
    </p>
  )
}

type SummaryCardsProps = {
  summary: DashboardSummary
  month: MonthKey
}

/** Tarjetas de gasto total, aportaciones de ambos miembros y deuda mensual. */
export default function SummaryCards({ summary, month }: SummaryCardsProps) {
  const { totalCents } = summary
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        id="stat-total"
        label="Gastos del mes"
        amountCents={totalCents}
        icon={
          <IconTile>
            <CardIcon className="size-7" />
          </IconTile>
        }
        highlighted
      >
        <MonthComparison
          totalCents={totalCents}
          previousCents={summary.previousMonthTotalCents}
          month={month}
        />
      </StatCard>
      <StatCard
        id="stat-mine"
        label="Tu aportación"
        amountCents={summary.myContributionCents}
        icon={
          <IconTile>
            <UserIcon className="size-7" />
          </IconTile>
        }
      >
        {formatShare(summary.myContributionCents, totalCents)} del total
      </StatCard>
      <StatCard
        id="stat-partner"
        label="Aportación pareja"
        amountCents={summary.partnerContributionCents}
        icon={
          <IconTile tone="blue">
            <UserIcon className="size-7" />
          </IconTile>
        }
      >
        {formatShare(summary.partnerContributionCents, totalCents)} del total
      </StatCard>
      <StatCard
        id="stat-pending"
        label="Saldo pendiente"
        amountCents={summary.pending.amountCents}
        icon={
          <IconTile>
            <ScaleIcon className="size-7" />
          </IconTile>
        }
        highlighted
      >
        <PendingStatus pending={summary.pending} />
      </StatCard>
    </div>
  )
}
