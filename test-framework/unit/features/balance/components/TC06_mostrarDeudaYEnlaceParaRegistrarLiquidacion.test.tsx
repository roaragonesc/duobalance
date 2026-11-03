import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { BalanceMonth, Settlement } from '../../../../../src/features/balance/types'
import BalanceView from '../../../../../src/features/balance/components/BalanceView'

// Sample data used only in tests.
const settlement: Settlement = {
  id: 's1',
  date: '2026-10-20',
  note: 'Bizum',
  amountCents: 2000,
  paidBy: 'me',
}

const balance: BalanceMonth = {
  month: { amountCents: 3000, debtor: 'me' },
  accumulated: { amountCents: 4500, debtor: 'me' },
  members: {
    me: { shareBasisPoints: 6000, contributionCents: 60000 },
    partner: { shareBasisPoints: 4000, contributionCents: 40000 },
  },
  summary: {
    incomesCents: 400000,
    sharedExpensesCents: 100000,
    remainingCents: 300000,
  },
  settlements: [settlement],
}

function renderView(
  data: BalanceMonth | null,
  history: Settlement[] | null = [
    settlement,
    { ...settlement, id: 's0', date: '2025-12-01', note: null },
  ],
) {
  render(
    <MemoryRouter>
      <BalanceView
        state={{ status: 'ready', data }}
        history={{ status: 'ready', data: history }}
        month="2026-10"
        partnerName="Pablo"
        onRetry={vi.fn()}
        onRetryHistory={vi.fn()}
      />
    </MemoryRouter>,
  )
}

describe('BalanceView', () => {
  it('TC06_mostrarDeudaYEnlaceParaRegistrarLiquidacion', () => {
    renderView(balance)
    const owes = screen.getByRole('region', { name: '¿Quién debe a quién?' })
    expect(owes.textContent).toContain('Tú debes a Pablo')
    expect(screen.getByRole('link', { name: 'Registrar liquidación' }).getAttribute('href')).toBe(
      '/balance/settle',
    )
    expect(screen.getByRole('region', { name: 'Tu aportación' }).textContent).toContain(
      'Aporta el 60 %',
    )
  })

  it('TC07_mostrarCuentasSaldadasSinAccionDeLiquidacion', () => {
    renderView({ ...balance, accumulated: { amountCents: 0, debtor: null } })
    expect(screen.getByText('No hay saldos pendientes')).toBeTruthy()
    expect(screen.getByText('Las cuentas están al día.')).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Registrar liquidación' })).toBeNull()
  })

  it('TC08_alternarLiquidacionesMensualesEHistorialConTeclado', async () => {
    renderView(balance)
    const monthTab = screen.getByRole('tab', { name: 'Liquidaciones' })
    expect(monthTab.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tabpanel').textContent).toContain('Bizum')
    expect(screen.getByRole('cell', { name: 'Liquidada' })).toBeTruthy()

    monthTab.focus()
    await userEvent.keyboard('{ArrowRight}')
    const historyTab = screen.getByRole('tab', { name: 'Historial' })
    expect(historyTab.getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(historyTab)
    expect(screen.getByRole('table', { name: 'Historial de liquidaciones' })).toBeTruthy()
    expect(screen.getByRole('rowheader', { name: 'Liquidación' })).toBeTruthy()
  })

  it('TC09_mostrarEstadoVacioSinBalance', () => {
    renderView(null)
    expect(
      screen.getByRole('heading', {
        name: 'Todavía no hay balance en octubre',
      }),
    ).toBeTruthy()
  })
})
