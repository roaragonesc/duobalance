import { useRef, useState, type FormEvent } from 'react'

export type FieldErrors<T> = Partial<Record<keyof T, string>>

// Drops the fields whose validator returned undefined.
export function collectErrors<T>(
  errors: Partial<Record<keyof T, string | undefined>>,
): FieldErrors<T> {
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message !== undefined),
  ) as FieldErrors<T>
}

type UseValidatedFormOptions<T extends Record<string, string>> = {
  initialValues: T
  validate: (values: T) => FieldErrors<T>
  onSubmit: (values: T) => Promise<unknown>
  getErrorMessage: (error: unknown) => string
}

export function useValidatedForm<T extends Record<string, string>>({
  initialValues,
  validate,
  onSubmit,
  getErrorMessage,
}: UseValidatedFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FieldErrors<T>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submittingRef = useRef(false)

  function setValue(name: keyof T, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    const form = event.currentTarget
    const nextErrors = validate(values)
    setErrors(nextErrors)
    setFormError(null)

    const firstInvalid = (Object.keys(initialValues) as (keyof T)[]).find(
      (name) => nextErrors[name],
    )
    if (firstInvalid !== undefined) {
      const field = form.elements.namedItem(String(firstInvalid))
      if (field instanceof HTMLElement) field.focus()
      return
    }

    submittingRef.current = true
    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return { values, errors, formError, isSubmitting, setValue, handleSubmit }
}
