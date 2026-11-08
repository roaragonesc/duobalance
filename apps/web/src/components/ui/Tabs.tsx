import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'

export type TabItem<T extends string> = { id: T; label: string }

type TabsProps<T extends string> = {
  label: string
  tabs: TabItem<T>[]
  selected: T
  onSelect: (id: T) => void
  children: ReactNode
}

/** Pestañas WAI-ARIA con panel asociado y selección por flechas, Inicio y Fin. */
export default function Tabs<T extends string>({
  label,
  tabs,
  selected,
  onSelect,
  children,
}: TabsProps<T>) {
  const baseId = useId()
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = tabs.length - 1
    const next =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null
    if (next === null) return
    event.preventDefault()
    onSelect(tabs[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex gap-6 border-b border-[#E3EEF2]">
        {tabs.map((tab, index) => {
          const active = tab.id === selected
          return (
            <button
              key={tab.id}
              ref={(element) => {
                refs.current[index] = element
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={active}
              aria-controls={`${baseId}-panel`}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`-mb-px border-b-[3px] px-1 pb-3 text-[17px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
                active ? 'border-[#00A967] text-navy' : 'border-transparent text-[#56637F] hover:text-navy'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${selected}`}
        className="pt-5"
      >
        {children}
      </div>
    </div>
  )
}