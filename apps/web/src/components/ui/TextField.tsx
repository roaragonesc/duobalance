import { useState, type ReactNode } from 'react'
import { EyeIcon, EyeOffIcon } from './icons'

type PasswordToggleLabels = {
  show: string
  hide: string
}

type TextFieldProps = {
  id: string
  label: string
  type: 'text' | 'email' | 'password'
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  autoComplete: string
  error?: string
  passwordToggle?: PasswordToggleLabels
  showLabel?: boolean
  describedBy?: string
  placeholder?: string
  inputMode?: 'text' | 'decimal' | 'email'
}

/** Campo controlado de texto, correo o contraseña con etiqueta, errores y visibilidad opcional. */
export default function TextField({
  id,
  label,
  type,
  icon,
  value,
  onChange,
  autoComplete,
  error,
  passwordToggle,
  showLabel = false,
  describedBy,
  placeholder,
  inputMode,
}: TextFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const errorId = `${id}-error`
  const inputType = passwordToggle && isPasswordVisible ? 'text' : type
  const descriptionIds =
    [describedBy, error ? errorId : undefined].filter(Boolean).join(' ') ||
    undefined

  return (
    <div>
      {/* Dark auth designs show only placeholders; the label stays associated for assistive tech. */}
      <label
        htmlFor={id}
        className={
          showLabel
            ? 'mb-2 block text-left text-[18px] font-bold text-navy'
            : 'sr-only'
        }
      >
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-[18px] -translate-y-1/2 text-[#1C2B45]">
          {icon}
        </span>
        <input
          id={id}
          name={id}
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder ?? (showLabel ? undefined : label)}
          autoComplete={autoComplete}
          inputMode={inputMode}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={descriptionIds}
          className={`h-[52px] w-full text-[17px] rounded-[12px] border bg-white pl-[62px] text-navy placeholder:text-[#64748B] focus:outline-2 focus:outline-offset-0 focus:outline-navy ${
            passwordToggle ? 'pr-14' : 'pr-4'
          } ${error ? 'border-red-600' : 'border-[#D5DCE4]'}`}
        />
        {passwordToggle && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            aria-controls={id}
            className="absolute top-1/2 right-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-[#1C2B45] hover:bg-ice focus-visible:outline-2 focus-visible:outline-navy"
          >
            <span className="sr-only">
              {isPasswordVisible ? passwordToggle.hide : passwordToggle.show}
            </span>
            {isPasswordVisible ? (
              <EyeOffIcon className="size-[26px]" />
            ) : (
              <EyeIcon className="size-[26px]" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-left text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  )
}
