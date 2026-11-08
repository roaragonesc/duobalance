import type { ReactNode } from 'react'

type SubmitButtonProps = {
  label: string
  loadingLabel: string
  isSubmitting: boolean
  variant?: 'mint' | 'green'
  icon?: ReactNode
  iconPosition?: 'start' | 'end'
}

const variantClasses = {
  mint: 'bg-mint text-navy hover:bg-[#3BCDA9] focus-visible:outline-navy',
  // Slightly darker than the mock-up green so white text keeps WCAG AA contrast.
  green:
    'bg-linear-to-b from-[#00A967] to-[#009A5F] text-white shadow-[0_8px_18px_rgba(0,154,95,0.25)] hover:from-[#009A5F] hover:to-[#008C56] focus-visible:outline-navy',
}

/** Botón de envío con texto de carga y bloqueo mientras el formulario está enviándose. */
export default function SubmitButton({
  label,
  loadingLabel,
  isSubmitting,
  variant = 'mint',
  icon,
  iconPosition = 'start',
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className={`mt-7 flex h-[54px] text-[20px] w-full items-center justify-center gap-3 rounded-[12px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none ${variantClasses[variant]}`}
    >
      {iconPosition === 'start' && icon}
      {isSubmitting ? loadingLabel : label}
      {iconPosition === 'end' && icon}
    </button>
  )
}
