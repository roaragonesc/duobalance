import { collectErrors, type FieldErrors } from '../../hooks/useValidatedForm'
import {
  amountToCents,
  CONCEPT_MAX_LENGTH,
  validateAmount,
  validateConcept,
  validatePastDate,
} from '../../lib/formValidation'
import { todayIso } from '../../lib/month'
import { isCategoryId } from './categories'
import type { ExpenseInput, ExpenseKind } from './types'

export const EXPENSE_DESCRIPTION_MAX_LENGTH = CONCEPT_MAX_LENGTH

export type ExpenseFormValues = {
  description: string
  amount: string
  date: string
  categoryId: string
  kind: ExpenseKind
}

export function validateExpense(
  values: ExpenseFormValues,
  today = todayIso(),
): FieldErrors<ExpenseFormValues> {
  return collectErrors<ExpenseFormValues>({
    description: validateConcept(values.description),
    amount: validateAmount(values.amount),
    date: validatePastDate(values.date, today),
    categoryId: isCategoryId(values.categoryId)
      ? undefined
      : 'Selecciona una categoría.',
  })
}

// Call only after validateExpense returned no errors.
export function toExpenseInput(values: ExpenseFormValues): ExpenseInput {
  const categoryId = values.categoryId
  if (!isCategoryId(categoryId)) throw new Error('Invalid category')
  return {
    description: values.description.trim(),
    amountCents: amountToCents(values.amount),
    date: values.date,
    categoryId,
    kind: values.kind,
  }
}