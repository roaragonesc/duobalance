export type DonutSegment = {
  id: string
  color: string
  value: number
}

const RADIUS = 48
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type DonutChartProps = {
  segments: DonutSegment[]
  total: number
  centerValue: string
  centerLabel: string
  size?: 'md' | 'sm'
}

/** Dibuja un anillo decorativo con segmentos y total; la pantalla debe ofrecer también los datos como texto. */
export default function DonutChart({
  segments,
  total,
  centerValue,
  centerLabel,
  size = 'md',
}: DonutChartProps) {
  const small = size === 'sm'
  const arcs = segments.map((segment, index) => {
    const start = segments.slice(0, index).reduce((sum, item) => sum + item.value, 0)
    return {
      ...segment,
      length: total > 0 ? (segment.value / total) * CIRCUMFERENCE : 0,
      offset: total > 0 ? (start / total) * CIRCUMFERENCE : 0,
    }
  })

  return (
    <div className={`relative shrink-0 ${small ? 'size-[132px]' : 'size-[210px]'}`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true" focusable="false">
        <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#EEF3F6" strokeWidth="16" />
        {arcs.map((arc) => (
          <circle
            key={arc.id}
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke={arc.color}
            strokeWidth="16"
            strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
            strokeDashoffset={-arc.offset}
          />
        ))}
      </svg>
      <p className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`font-bold text-navy ${small ? 'text-[17px]' : 'text-[24px]'}`}>
          {centerValue}
        </span>
        <span className={`text-[#56637F] ${small ? 'text-[13px]' : 'text-[15px]'}`}>
          {centerLabel}
        </span>
      </p>
    </div>
  )
}