import { formatCents, formatShare } from '../../../lib/money'
import type { DashboardCategory } from '../types'
import { panelClassName } from '../../../components/ui/panel'
import DonutChart from '../../../components/ui/DonutChart'

const COLORS = ['#2FD3A7', '#FBBF24', '#3B9CF5', '#A47CF3', '#F472B6', '#94A3B8']

type CategoryBreakdownProps = {
  categories: DashboardCategory[]
  totalCents: number
}

/** Ordena gastos por importe y muestra su reparto en un gráfico decorativo y una tabla accesible. */
export default function CategoryBreakdown({
  categories,
  totalCents,
}: CategoryBreakdownProps) {
  const sorted = [...categories]
    .filter((category) => category.amountCents > 0)
    .sort((a, b) => b.amountCents - a.amountCents)
  const segments = sorted.map((category, index) => ({
    ...category,
    color: COLORS[index % COLORS.length],
    value: category.amountCents,
  }))

  return (
    <section
      aria-labelledby="categories-title"
      className={`p-6 lg:col-span-7 ${panelClassName}`}
    >
      <h2 id="categories-title" className="text-[21px] font-bold text-navy">
        Gastos por categoría
      </h2>
      <div className="mt-5 flex flex-col items-center gap-8 md:flex-row">
        <DonutChart
          segments={segments}
          total={totalCents}
          centerValue={formatCents(totalCents)}
          centerLabel="Total"
        />
        <table className="w-full max-w-[380px] text-[16px] text-navy">
          <caption className="sr-only">Gasto y porcentaje por categoría</caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">Categoría</th>
              <th scope="col">Importe</th>
              <th scope="col">Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((segment) => (
              <tr key={segment.id}>
                <th scope="row" className="py-2 text-left font-medium">
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="size-3.5 shrink-0 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    {segment.name}
                  </span>
                </th>
                <td className="py-2 text-right font-semibold">
                  {formatCents(segment.amountCents)}
                </td>
                <td className="w-16 py-2 text-right text-[#56637F]">
                  {formatShare(segment.amountCents, totalCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
