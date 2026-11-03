import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { DashboardSummary } from '../../../../../src/features/dashboard/types'
import DashboardView from '../../../../../src/features/dashboard/components/DashboardView'
import MonthSelector from '../../../../../src/components/ui/MonthSelector'

// Sample data used only in tests.
const summary: DashboardSummary = {
  totalCents: 100000,
  previousMonthTotalCents: 80000,
  myContributionCents: 60000,
  partnerContributionCents: 40000,
  pending: { amountCents: 0, debtor: null },
  categories: [
    { id: 'c1', name: 'Supermercado', amountCents: 70000 },
    { id: 'c2', name: 'Ocio', amountCents: 30000 },
  ],
  recentExpenses: [
    { id: 'e1', categoryId: 'food', description: 'Compra semanal', amountCents: 7000, date: '2026-10-03' },
  ],
}

function renderView(state: Parameters<typeof DashboardView>[0]['state']) {
  const onRetry = vi.fn()
  render(
    <MemoryRouter>
      <DashboardView state={state} month="2026-11" onRetry={onRetry} />
    </MemoryRouter>,
  )
  return onRetry
}

describe('DashboardView', () => {
  it('TC16_anunciarEstadoDeCarga', () => {
    renderView({ status: 'loading' })
    expect(screen.getByRole('status', { name: 'Cargando resumen del mes' })).toBeTruthy()
  })

  it('TC17_mostrarAlertaYReintentarTrasError', async () => {
    const onRetry = renderView({ status: 'error' })
    expect(screen.getByRole('alert').textContent).toContain('No se ha podido cargar')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('TC18_mostrarEstadoVacioSinDatos', () => {
    renderView({ status: 'ready', data: null })
    screen.getByRole('heading', { name: 'Todavía no hay gastos en noviembre' })
  })

  it('TC19_mostrarResumenFinanciero', () => {
    renderView({ status: 'ready', data: summary })
    screen.getByRole('heading', { name: 'Gastos del mes' })
    expect(screen.getByText('+25% vs. octubre')).toBeTruthy()
    expect(screen.getByText('60% del total')).toBeTruthy()
    screen.getByRole('rowheader', { name: 'Supermercado' })
    expect(screen.getByText('70%')).toBeTruthy()
    expect(screen.getByText('Compra semanal')).toBeTruthy()
    expect(screen.getAllByText('Todo al día')).toHaveLength(2)
  })

  it('TC20_mantenerResumenDeSoloLecturaSinAltaDeGastos', () => {
    renderView({ status: 'ready', data: summary })
    expect(screen.queryByRole('link', { name: 'Añadir gasto' })).toBeNull()
  })
})

describe('MonthSelector', () => {
  it('TC21_navegarEntreMesesYBloquearLosFuturos', async () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <MonthSelector month="2026-11" canGoNext={false} onChange={onChange} />,
    )
    screen.getByText('Noviembre 2026')
    expect(
      (screen.getByRole('button', { name: 'Mes siguiente' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Mes anterior' }))
    expect(onChange).toHaveBeenCalledWith('2026-10')

    rerender(<MonthSelector month="2026-10" canGoNext onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Mes siguiente' }))
    expect(onChange).toHaveBeenLastCalledWith('2026-11')
  })
})
