import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BackendUnavailableError } from '../../../lib/backend'
import SplitMethodForm from './SplitMethodForm'

describe('SplitMethodForm', () => {
  it('only offers saving after choosing a different method', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<SplitMethodForm current="equal" onSubmit={onSubmit} />)
    expect((screen.getByRole('radio', { name: '50/50' }) as HTMLInputElement).checked).toBe(true)
    expect(screen.queryByRole('button', { name: 'Guardar método de reparto' })).toBeNull()

    await userEvent.click(screen.getByRole('radio', { name: 'Proporcional' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar método de reparto' }))
    expect(onSubmit).toHaveBeenCalledWith('proportional')
    expect(await screen.findByText('Método de reparto actualizado.')).toBeTruthy()
  })

  it('explains that the change is not connected yet', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new BackendUnavailableError('Split method'))
    render(<SplitMethodForm current="equal" onSubmit={onSubmit} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Proporcional' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar método de reparto' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/falta conectar/)
  })
})
