import { collectErrors, type FieldErrors } from '../../hooks/useValidatedForm'
import {
  amountToCents,
  validateAmount,
  validateConcept,
  validatePastDate,
} from '../../lib/formValidation'
import { todayIso } from '../../lib/month'
import type { IncomeInput } from './types'

export type IncomeFormValues = {
  description: string
  amount: string
  date: string
}

export function validateIncome(
  values: IncomeFormValues,
  today = todayIso(),
): FieldErrors<IncomeFormValues> {
  return collectErrors<IncomeFormValues>({
    description: validateConcept(values.description),
    amount: validateAmount(values.amount),
    date: validatePastDate(values.date, today),
  })
}

// Call only after validateIncome returned no errors.
export function toIncomeInput(values: IncomeFormValues): IncomeInput {
  return {
    description: values.description.trim(),
    amountCents: amountToCents(values.amount),
    date: values.date,
  }
}