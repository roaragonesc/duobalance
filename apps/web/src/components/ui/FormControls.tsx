import { useId, type ReactNode } from 'react'

export const fieldLabelClassName = 'mb-2 block text-left text-[18px] font-bold text-navy'

export const controlClassName =
  'h-[52px] w-full rounded-[12px] border bg-white px-4 text-[17px] text-navy focus:outline-2 focus:outline-offset-0 focus:outline-navy'

/** Anuncia el error de un campo y permite asociarlo al control mediante su ID. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-1.5 text-left text-sm text-red-700">
      {message}
    </p>
  )
}

type DateFieldProps = {
  id: string
  label: string
  value: string
  max?: string
  error?: string
  onChange: (value: string) => void
}

/** Campo de fecha controlado con etiqueta visible, límite opcional y error accesible. */
export function DateField({ id, label, value, max, error, onChange }: DateFieldProps) {
  const errorId = useId()
  return (
    <div>
      <label htmlFor={id} className={fieldLabelClassName}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="date"
        required
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${controlClassName} ${error ? 'border-red-600' : 'border-[#D5DCE4]'}`}
      />
      <FieldError id={errorId} message={error} />
    </div>
  )
}

type SelectFieldProps = {
  id: string
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
  children: ReactNode
}

/** Selector de formulario con etiqueta asociada, valor controlado y validación accesible. */
export function SelectField({ id, label, value, error, onChange, children }: SelectFieldProps) {
  const errorId = useId()
  return (
    <div>
      <label htmlFor={id} className={fieldLabelClassName}>
        {label}
      </label>
      <select
        id={id}
        name={id}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${controlClassName} ${error ? 'border-red-600' : 'border-[#D5DCE4]'}`}
      >
        {children}
      </select>
      <FieldError id={errorId} message={error} />
    </div>
  )
}

const filterClassName =
  'h-12 w-full rounded-[14px] border border-[#D5DCE4] bg-white px-4 text-[16px] text-navy focus:outline-2 focus:outline-offset-0 focus:outline-navy'

type FilterSelectProps = {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}

/** Selector accesible para filtrar listados sin gestionar ni duplicar su estado. */
export function FilterSelect({ label, value, onChange, children }: FilterSelectProps) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[15px] font-semibold text-navy">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={filterClassName}
      >
        {children}
      </select>
    </div>
  )
}
