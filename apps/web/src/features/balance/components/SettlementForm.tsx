import FormAlert from '../../../components/ui/FormAlert'
import { DateField } from '../../../components/ui/FormControls'
import SubmitButton from '../../../components/ui/SubmitButton'
import TextField from '../../../components/ui/TextField'
import { CardIcon, TagIcon } from '../../../components/ui/icons'
import { useValidatedForm } from '../../../hooks/useValidatedForm'
import { formatCents } from '../../../lib/money'
import { todayIso } from '../../../lib/month'
import type { PendingBalance } from '../../dashboard/types'
import type { SettlementInput } from '../types'
import {
  toSettlementInput,
  validateSettlement,
  type SettlementFormValues,
} from '../validation'

type SettlementFormProps = {
  /** Current accumulated debt; it must be pending (debtor not null). */
  pending: PendingBalance
  partnerLabel: string
  onSubmit: (input: SettlementInput) => Promise<void>
  getErrorMessage: (error: unknown) => string
}

/** Formulario de pago manual parcial con importe limitado por deuda, fecha y nota opcional. */
export default function SettlementForm({
  pending,
  partnerLabel,
  onSubmit,
  getErrorMessage,
}: SettlementFormProps) {
  const { values, errors, formError, isSubmitting, setValue, handleSubmit } =
    useValidatedForm<SettlementFormValues>({
      initialValues: { amount: '', date: todayIso(), note: '' },
      validate: (formValues) => validateSettlement(formValues, pending.amountCents),
      onSubmit: (formValues) => onSubmit(toSettlementInput(formValues)),
      getErrorMessage,
    })

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      <FormAlert message={formError} />
      <p className="rounded-[14px] bg-ice px-4 py-3 text-[16px] text-navy">
        {pending.debtor === 'me'
          ? `Pago de ti a ${partnerLabel}. `
          : `Pago de ${partnerLabel} a ti. `}
        Deuda pendiente: <strong>{formatCents(pending.amountCents)}</strong>.
        Puedes registrar un pago parcial.
      </p>
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
      <TextField
        id="note"
        label="Concepto (opcional)"
        type="text"
        autoComplete="off"
        placeholder="Bizum de octubre"
        icon={<TagIcon className="size-6" />}
        value={values.note}
        onChange={(value) => setValue('note', value)}
        error={errors.note}
        showLabel
      />
      <SubmitButton
        label="Registrar liquidación"
        loadingLabel="Registrando liquidación…"
        isSubmitting={isSubmitting}
        variant="green"
      />
    </form>
  )
}