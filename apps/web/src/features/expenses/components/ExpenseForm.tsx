import { useId } from 'react'
import FormAlert from '../../../components/ui/FormAlert'
import {
  DateField,
  fieldLabelClassName,
  SelectField,
} from '../../../components/ui/FormControls'
import SubmitButton from '../../../components/ui/SubmitButton'
import TextField from '../../../components/ui/TextField'
import { CardIcon, TagIcon, UserIcon, UsersIcon } from '../../../components/ui/icons'
import { useValidatedForm } from '../../../hooks/useValidatedForm'
import { todayIso } from '../../../lib/month'
import { expenseCategories } from '../categories'
import type { ExpenseInput } from '../types'
import {
  toExpenseInput,
  validateExpense,
  type ExpenseFormValues,
} from '../validation'

type ExpenseFormProps = {
  initialValues: ExpenseFormValues
  submitLabel: string
  /** The kind is fixed once the expense exists. */
  kindLocked?: boolean
  onSubmit: (input: ExpenseInput) => Promise<void>
  getErrorMessage: (error: unknown) => string
}


const kindOptions = [
  {
    value: 'shared',
    title: 'Compartido',
    description: 'Lo veis los dos y cuenta para el balance.',
    icon: UsersIcon,
  },
  {
    value: 'individual',
    title: 'Individual',
    description: 'Solo lo ves tú y no afecta al balance.',
    icon: UserIcon,
  },
] as const

/** Formulario validado de gasto con importe, fecha, categoría y privacidad; bloquea el tipo al editar. */
export default function ExpenseForm({
  initialValues,
  submitLabel,
  kindLocked = false,
  onSubmit,
  getErrorMessage,
}: ExpenseFormProps) {
  const kindNoteId = useId()
  const { values, errors, formError, isSubmitting, setValue, handleSubmit } =
    useValidatedForm({
      initialValues,
      validate: validateExpense,
      onSubmit: (formValues) => onSubmit(toExpenseInput(formValues)),
      getErrorMessage,
    })

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      <FormAlert message={formError} />
      <TextField
        id="description"
        label="Concepto"
        type="text"
        autoComplete="off"
        placeholder="Supermercado"
        icon={<TagIcon className="size-6" />}
        value={values.description}
        onChange={(value) => setValue('description', value)}
        error={errors.description}
        showLabel
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          id="amount"
          label="Importe (€)"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,00"
          icon={<CardIcon className="size-6" />}
          value={values.amount}
          onChange={(value) => setValue('amount', value)}
          error={errors.amount}
          showLabel
        />
        <DateField
          id="date"
          label="Fecha"
          max={todayIso()}
          value={values.date}
          error={errors.date}
          onChange={(value) => setValue('date', value)}
        />
      </div>
      <SelectField
        id="categoryId"
        label="Categoría"
        value={values.categoryId}
        error={errors.categoryId}
        onChange={(value) => setValue('categoryId', value)}
      >
        <option value="">Selecciona una categoría</option>
        {expenseCategories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </SelectField>
      <fieldset
        disabled={kindLocked}
        aria-describedby={kindLocked ? kindNoteId : undefined}
      >
        <legend className={fieldLabelClassName}>Tipo de gasto</legend>
        {kindLocked && (
          <p id={kindNoteId} className="-mt-1 mb-3 text-[15px] text-[#56637F]">
            El tipo no se puede cambiar una vez creado el gasto.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {kindOptions.map(({ value, title, description, icon: Icon }) => (
            <label
              key={value}
              className="flex cursor-pointer items-start has-disabled:cursor-not-allowed has-disabled:opacity-70 gap-3 rounded-[14px] border border-[#D5DCE4] bg-white p-4 has-checked:border-[#00A967] has-checked:bg-[#EFFBF7] has-focus-visible:outline-2 has-focus-visible:outline-navy"
            >
              <input
                type="radio"
                name="kind"
                value={value}
                checked={values.kind === value}
                onChange={() => setValue('kind', value)}
                className="mt-1 size-5 accent-[#00A967]"
              />
              <span>
                <span className="flex items-center gap-2 text-[17px] font-bold text-navy">
                  <Icon className="size-5" />
                  {title}
                </span>
                <span className="mt-1 block text-[15px] text-[#56637F]">
                  {description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <SubmitButton
        label={submitLabel}
        loadingLabel="Guardando gasto…"
        isSubmitting={isSubmitting}
        variant="green"
      />
    </form>
  )
}
