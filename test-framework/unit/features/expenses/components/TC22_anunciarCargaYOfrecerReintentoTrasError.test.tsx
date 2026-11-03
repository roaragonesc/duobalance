import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ExpensesUnavailableError, getExpenseErrorMessage } from '../../../../../src/features/expenses/expenseService'
import type { ExpenseMonth } from '../../../../../src/features/expenses/types'
import ExpenseForm from '../../../../../src/features/expenses/components/ExpenseForm'
import ExpensesView from '../../../../../src/features/expenses/components/ExpensesView'

// Sample data used only in tests.
const month: ExpenseMonth = {
  totalCents: 10480,
  sharedCents: 8080,
  individualCents: 2400,
  pending: { amountCents: 0, debtor: null },
  expenses: [
    {
      id: 'e1',
      description: 'Supermercado',
      amountCents: 5680,
      date: '2026-11-02',
      categoryId: 'food',
      kind: 'shared',
      paidBy: 'partner',
      canEdit: false,
    },
    {
      id: 'e2',
      description: 'Cena con amigos',
      amountCents: 2400,
      date: '2026-11-01',
      categoryId: 'leisure',
      kind: 'individual',
      paidBy: 'me',
      canEdit: true,
    },
    {
      id: 'e3',
      description: 'Internet',
      amountCents: 2400,
      date: '2026-10-26',
      categoryId: 'utilities',
      kind: 'shared',
      paidBy: 'me',
      canEdit: true,
    },
  ],
}

function renderView(state: Parameters<typeof ExpensesView>[0]['state']) {
  const onDelete = vi.fn()
  const onRetry = vi.fn()
  render(
    <MemoryRouter>
      <ExpensesView
        state={state}
        month="2026-10"
        partnerName="Pablo"
        onRetry={onRetry}
        onDelete={onDelete}
      />
    </MemoryRouter>,
  )
  return { onDelete, onRetry }
}

const rowNames = () =>
  screen.queryAllByRole('rowheader').map((cell) => cell.textContent)

describe('ExpensesView', () => {
  it('TC22_anunciarCargaYOfrecerReintentoTrasError', async () => {
    renderView({ status: 'loading' })
    screen.getByRole('status', { name: 'Cargando gastos del mes' })
  })

  it('TC23_reintentarCargaTrasError', async () => {
    const { onRetry } = renderView({ status: 'error' })
    screen.getByRole('alert')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('TC24_mostrarEstadoVacioConEnlaceParaAnadirGasto', () => {
    renderView({ status: 'ready', data: null })
    screen.getByRole('heading', { name: 'Todavía no hay gastos en octubre' })
    expect(
      screen.getByRole('link', { name: 'Añadir gasto' }).getAttribute('href'),
    ).toBe('/expenses/new?mes=2026-10')
  })

  it('TC25_listarGastosYFiltrarPorTipoYCategoria', async () => {
    renderView({ status: 'ready', data: month })
    expect(rowNames()).toEqual(['Supermercado', 'Cena con amigos', 'Internet'])

    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'individual')
    expect(rowNames()).toEqual(['Cena con amigos'])

    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'all')
    await userEvent.selectOptions(screen.getByLabelText('Categoría'), 'utilities')
    expect(rowNames()).toEqual(['Internet'])

    await userEvent.selectOptions(screen.getByLabelText('Categoría'), 'health')
    screen.getByText('No hay gastos con estos filtros.')
  })

  it('TC26_ofrecerAccionesSoloEnGastosPropios', async () => {
    const { onDelete } = renderView({ status: 'ready', data: month })
    const partnerRow = screen.getByRole('row', { name: /Supermercado/ })
    expect(within(partnerRow).queryByRole('button')).toBeNull()
    expect(within(partnerRow).getByText('Pablo')).toBeTruthy()

    expect(
      screen.getByRole('link', { name: 'Editar Internet' }).getAttribute('href'),
    ).toBe('/expenses/e3/edit')
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar Internet' }))
    expect(onDelete).toHaveBeenCalledWith(month.expenses[2])
  })
})

describe('ExpenseForm', () => {
  const initialValues = {
    description: '',
    amount: '',
    date: '2026-11-02',
    categoryId: '',
    kind: 'shared' as const,
  }

  it('TC27_validarCamposDeFormaAccesibleAntesDeEnviar', async () => {
    const onSubmit = vi.fn()
    render(
      <ExpenseForm
        initialValues={initialValues}
        submitLabel="Añadir gasto"
        onSubmit={onSubmit}
        getErrorMessage={() => 'error'}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Añadir gasto' }))
    expect(onSubmit).not.toHaveBeenCalled()
    const description = screen.getByLabelText('Concepto')
    expect(description.getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(description)
  })

  it('TC28_enviarCentimosYMostrarErrorDelBackend', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ExpensesUnavailableError())
    render(
      <ExpenseForm
        initialValues={initialValues}
        submitLabel="Añadir gasto"
        onSubmit={onSubmit}
        getErrorMessage={(error) => getExpenseErrorMessage(error, 'error')}
      />,
    )
    await userEvent.type(screen.getByLabelText('Concepto'), 'Gimnasio')
    await userEvent.type(screen.getByLabelText('Importe (€)'), '48')
    await userEvent.selectOptions(screen.getByLabelText('Categoría'), 'health')
    await userEvent.click(screen.getByRole('radio', { name: /Individual/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Añadir gasto' }))

    expect(onSubmit).toHaveBeenCalledWith({
      description: 'Gimnasio',
      amountCents: 4800,
      date: '2026-11-02',
      categoryId: 'health',
      kind: 'individual',
    })
    expect((await screen.findByRole('alert')).textContent).toContain(
      'falta conectar la base de datos',
    )
  })

  it('TC29_bloquearTipoDeGastoDuranteEdicion', () => {
    render(
      <ExpenseForm
        initialValues={{ ...initialValues, kind: 'individual' }}
        submitLabel="Guardar cambios"
        kindLocked
        onSubmit={vi.fn()}
        getErrorMessage={() => 'error'}
      />,
    )
    const individual = screen.getByRole('radio', { name: /Individual/ }) as HTMLInputElement
    expect(individual.checked).toBe(true)
    expect(individual.matches(':disabled')).toBe(true)
    screen.getByText('El tipo no se puede cambiar una vez creado el gasto.')
  })
})