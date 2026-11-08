import type { ReactNode } from 'react'

type SplitMethodOptionProps = {
  name: string
  value: string
  title: string
  description: string
  icon: ReactNode
  checked: boolean
  onChange: () => void
}

/** Opción de reparto con radio nativo, descripción asociada y selección por teclado. */
export default function SplitMethodOption({
  name,
  value,
  title,
  description,
  icon,
  checked,
  onChange,
}: SplitMethodOptionProps) {
  const id = `${name}-${value}`
  const descriptionId = `${id}-description`

  return (
    <div
      className={`relative flex min-h-[115px] gap-4 rounded-[16px] border-2 p-4 text-left transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-navy motion-reduce:transition-none sm:px-5 ${
        checked
          ? 'border-mint bg-[#EAFDF7]'
          : 'border-[#E3E7EC] bg-white hover:border-[#C9D1DB]'
      }`}
    >
      <span className="mt-1 shrink-0 text-navy">{icon}</span>
      <div className="flex-1">
        <label
          htmlFor={id}
          className="block cursor-pointer text-[20px] font-bold text-navy after:absolute after:inset-0 after:rounded-[16px]"
        >
          {title}
        </label>
        <p id={descriptionId} className="mt-1 text-[16px] leading-snug text-[#56637F]">
          {description}
        </p>
      </div>
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        aria-describedby={descriptionId}
        className="relative mt-1 size-[24px] shrink-0 cursor-pointer appearance-none rounded-full border-2 border-[#8A94A6] bg-white checked:border-[#00A06A] checked:shadow-[inset_0_0_0_6px_#00A06A] focus:outline-none"
      />
    </div>
  )
}
