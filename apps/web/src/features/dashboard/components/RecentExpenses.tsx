import { Link } from 'react-router'
import { ArrowRightIcon } from '../../../components/ui/icons'
import { getCategory } from '../../expenses/categories'
import { formatCents } from '../../../lib/money'
import { currentMonth, formatDay, type MonthKey } from '../../../lib/month'
import type { DashboardExpense } from '../types'
import { IconTile, panelClassName } from '../../../components/ui/panel'

export default function RecentExpenses({
  expenses,
  month,
}: {
  expenses: DashboardExpense[]
  month: MonthKey
}) {
  return (
    <section
      aria-labelledby="recent-title"
      className={`p-6 lg:col-span-5 ${panelClassName}`}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="recent-title" className="text-[21px] font-bold text-navy">
          Últimos movimientos
        </h2>
        <Link
          to={month === currentMonth() ? '/expenses' : `/expenses?mes=${month}`}
          className="flex shrink-0 items-center gap-1.5 rounded-sm whitespace-nowrap text-[16px] font-semibold text-[#007A4D] hover:underline"
        >
          Ver todos
          <ArrowRightIcon className="size-5" />
        </Link>
      </div>
      {expenses.length === 0 ? (
        <p className="mt-6 text-[16px] text-[#56637F]">
          Todavía no hay movimientos este mes.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-[#E3EEF2]">
          {expenses.map((expense) => {
            const { icon: Icon } = getCategory(expense.categoryId)
            return (
              <li key={expense.id} className="flex items-center gap-4 py-3">
                <IconTile>
                  <Icon className="size-7" />
                </IconTile>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[17px] font-semibold text-navy">
                    {expense.description}
                  </p>
                  <p className="text-[15px] text-[#56637F]">
                    <time dateTime={expense.date}>{formatDay(expense.date)}</time>
                  </p>
                </div>
                <p className="text-[18px] font-bold text-navy">
                  {formatCents(expense.amountCents)}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
