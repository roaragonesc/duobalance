import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { BackendUnavailableError } from '../../../lib/backend'
import { getIncomeErrorMessage } from '../incomeService'
import type { IncomeMonth } from '../types'
import IncomesView from './IncomesView'

// Sample data used only in tests.
const month: IncomeMonth = {
  totalCents: 400000,
  myCents: 240000,
  partnerCents: 160000,
  incomes: [
    {
      id: 'i1',
      description: 'Nómina',
      amountCents: 240000,
      date: '2026-10-01',
      owner: 'me',
    },
    {
      id: 'i2',
      description: 'Nómina Pablo',
      amountCents: 160000,
      date: '2026-10-02',
      owner: 'partner',
    },
  ],
}

function renderView(state: Parameters<typeof IncomesView>[0]['state']) {
  const onDelete = vi.fn()
  const onRetry = vi.fn()
  render(
    <MemoryRouter>
      <IncomesView
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

describe('IncomesView', () => {
  it('shows totals and each member share', () => {
    renderView({ status: 'ready', data: month })
    const mine = screen.getByRole('region', { name: 'Tus ingresos' })
    expect(mine.textContent).toMatch(/2\.?400,00/)
    expect(mine.textContent).toMatch(/60\s?%\sdel total/)
    expect(screen.getByRole('region', { name: 'Ingresos de Pablo' }).textContent).toMatch(
      /40\s?%\sdel total/,
    )
    expect(screen.getByRole('region', { name: 'Reparto de aportaciones' })).toBeTruthy()
  })

  it('only lets the owner edit or delete an income', async () => {
    const { onDelete } = renderView({ status: 'ready', data: month })
    expect(screen.getByRole('link', { name: 'Editar Nómina' }).getAttribute('href')).toBe(
      '/incomes/i1/edit',
    )
    expect(screen.queryByRole('link', { name: 'Editar Nómina Pablo' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Eliminar Nómina Pablo' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar Nómina' }))
    expect(onDelete).toHaveBeenCalledWith(month.incomes[0])
  })

  it('filters by member', async () => {
    renderView({ status: 'ready', data: month })
    await userEvent.selectOptions(screen.getByLabelText('Miembro'), 'partner')
    const table = screen.getByRole('table')
    expect(within(table).getByRole('rowheader', { name: 'Nómina Pablo' })).toBeTruthy()
    expect(within(table).queryByRole('rowheader', { name: 'Nómina' })).toBeNull()
    expect(screen.getByRole('status').textContent).toContain('1 ingreso')
  })

  it('shows the empty state with a link that keeps the month', () => {
    renderView({ status: 'ready', data: null })
    expect(
      screen.getByRole('heading', {
        name: 'Todavía no hay ingresos en octubre',
      }),
    ).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Añadir ingreso' }).getAttribute('href')).toBe(
      '/incomes/new?mes=2026-10',
    )
  })

  it('lets the user retry after an error', async () => {
    const { onRetry } = renderView({ status: 'error' })
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('explains that the backend is not connected yet', () => {
    expect(getIncomeErrorMessage(new BackendUnavailableError('Incomes'), 'x')).toMatch(
      /falta conectar/,
    )
  })
})
