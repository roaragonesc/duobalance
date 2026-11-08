import FormAlert from '../../../components/ui/FormAlert'
import { DateField } from '../../../components/ui/FormControls'
import SubmitButton from '../../../components/ui/SubmitButton'
import TextField from '../../../components/ui/TextField'
import { BriefcaseIcon, CardIcon } from '../../../components/ui/icons'
import { useValidatedForm } from '../../../hooks/useValidatedForm'
import { todayIso } from '../../../lib/month'
import type { IncomeInput } from '../types'
import { toIncomeInput, validateIncome, type IncomeFormValues } from '../validation'

type IncomeFormProps = {
  initialValues: IncomeFormValues
  submitLabel: string
  onSubmit: (input: IncomeInput) => Promise<void>
  getErrorMessage: (error: unknown) => string
}

/** Formulario de ingreso propio con concepto, céntimos y fecha validados antes del envío. */
export default function IncomeForm({
  initialValues,
  submitLabel,
  onSubmit,
  getErrorMessage,
}: IncomeFormProps) {
  const { values, errors, formError, isSubmitting, setValue, handleSubmit } =
    useValidatedForm({
      initialValues,
      validate: validateIncome,
      onSubmit: (formValues) => onSubmit(toIncomeInput(formValues)),
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
        placeholder="Nómina"
        icon={<BriefcaseIcon className="size-6" />}
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
      <p className="text-[15px] text-[#56637F]">
        Solo tú puedes modificar o eliminar tus ingresos.
      </p>
      <SubmitButton
        label={submitLabel}
        loadingLabel="Guardando ingreso…"
        isSubmitting={isSubmitting}
        variant="green"
      />
    </form>
  )
}