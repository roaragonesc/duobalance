import type { ReactNode } from 'react'
import { formatCents } from '../../lib/money'

// Shared look of the white cards in the app screens.
export const panelClassName =
  'rounded-[20px] border border-[#E3EEF2] bg-white shadow-[0_6px_24px_rgba(11,32,56,0.05)]'

const tileTones = {
  mint: 'bg-[#E3F8F1] text-[#00A967]',
  blue: 'bg-[#E6F1FD] text-[#2F7DE1]',
  amber: 'bg-[#FFF4DB] text-[#C98A00]',
}

type IconTileProps = {
  children: ReactNode
  tone?: keyof typeof tileTones
}

/** Contenedor visual reutilizable para iconos con el tono indicado por la pantalla. */
export function IconTile({ children, tone = 'mint' }: IconTileProps) {
  return (
    <span
      className={`flex size-14 shrink-0 items-center justify-center rounded-[16px] ${tileTones[tone]}`}
    >
      {children}
    </span>
  )
}

type StatCardProps = {
  id: string
  label: string
  amountCents: number
  icon: ReactNode
  highlighted?: boolean
  children?: ReactNode
}

/** Tarjeta de indicador con título accesible, importe en euros y contenido complementario. */
export function StatCard({
  id,
  label,
  amountCents,
  icon,
  highlighted = false,
  children,
}: StatCardProps) {
  return (
    <section
      aria-labelledby={id}
      className={`flex gap-4 p-5 ${panelClassName} ${highlighted ? 'bg-[#EFFBF7]!' : ''}`}
    >
      {icon}
      <div className="min-w-0">
        <h2 id={id} className="text-[16px] font-medium text-[#3E4C63]">
          {label}
        </h2>
        <p className="mt-1 text-[28px] leading-tight font-bold text-navy">
          {formatCents(amountCents)}
        </p>
        {children && (
          <div className="mt-1.5 text-[15px] text-[#56637F]">{children}</div>
        )}
      </div>
    </section>
  )
}