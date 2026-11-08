import { panelClassName } from './panel'

/** Placeholder de pantallas mensuales que anuncia la carga y respeta la reducción de movimiento. */
export default function PageSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label}>
      <div aria-hidden="true" className="animate-pulse space-y-6 motion-reduce:animate-none">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className={`h-[130px] ${panelClassName}`} />
          ))}
        </div>
        <div className={`h-[340px] ${panelClassName}`} />
      </div>
    </div>
  )
}
