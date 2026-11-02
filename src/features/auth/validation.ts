import type { FieldErrors } from '../../hooks/useValidatedForm'

export type LoginValues = {
  email: string
  password: string
}

export type RegisterValues = {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export type ForgotPasswordValues = {
  email: string
}

export type ResetPasswordValues = {
  password: string
  confirmPassword: string
}

export type PasswordRule = {
  label: string
  test: (password: string) => boolean
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  { label: 'Mínimo 8 caracteres', test: (value) => value.length >= 8 },
  {
    label: 'Al menos una letra mayúscula',
    test: (value) => /\p{Lu}/u.test(value),
  },
  {
    label: 'Al menos una letra minúscula',
    test: (value) => /\p{Ll}/u.test(value),
  },
  { label: 'Al menos un número', test: (value) => /\d/.test(value) },
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): string | undefined {
  const value = email.trim()
  if (!value) return 'El correo electrónico es obligatorio.'
  if (!EMAIL_PATTERN.test(value)) return 'Introduce un correo electrónico válido.'
  return undefined
}

function validatePassword(password: string): string | undefined {
  return password ? undefined : 'La contraseña es obligatoria.'
}

function validateNewPassword(password: string): string | undefined {
  if (!password) return 'La contraseña es obligatoria.'
  if (!PASSWORD_RULES.every((rule) => rule.test(password))) {
    return 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.'
  }
  return undefined
}

function validateConfirmation(
  password: string,
  confirmation: string,
  emptyMessage: string,
): string | undefined {
  if (!confirmation) return emptyMessage
  if (confirmation !== password) return 'Las contraseñas no coinciden.'
  return undefined
}

function withoutEmpty<T>(errors: FieldErrors<T>): FieldErrors<T> {
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message),
  ) as FieldErrors<T>
}

export function validateLogin(values: LoginValues): FieldErrors<LoginValues> {
  return withoutEmpty({
    email: validateEmail(values.email),
    password: validatePassword(values.password),
  })
}

export function validateRegister(
  values: RegisterValues,
): FieldErrors<RegisterValues> {
  return withoutEmpty({
    name: values.name.trim() ? undefined : 'El nombre es obligatorio.',
    email: validateEmail(values.email),
    password: validateNewPassword(values.password),
    confirmPassword: validateConfirmation(
      values.password,
      values.confirmPassword,
      'Confirma la contraseña.',
    ),
  })
}

export function validateForgotPassword(
  values: ForgotPasswordValues,
): FieldErrors<ForgotPasswordValues> {
  return withoutEmpty({ email: validateEmail(values.email) })
}

export function validateResetPassword(
  values: ResetPasswordValues,
): FieldErrors<ResetPasswordValues> {
  return withoutEmpty({
    password: validateNewPassword(values.password),
    confirmPassword: validateConfirmation(
      values.password,
      values.confirmPassword,
      'Confirma la nueva contraseña.',
    ),
  })
}
