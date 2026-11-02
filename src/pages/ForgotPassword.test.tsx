import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ForgotPassword from './ForgotPassword'

const authService = vi.hoisted(() => ({ requestPasswordReset: vi.fn() }))
vi.mock('../features/auth/services/authService', () => authService)

beforeEach(() => vi.resetAllMocks())

function setup() {
  render(<MemoryRouter><ForgotPassword /></MemoryRouter>)
  return userEvent.setup()
}

describe('Recuperación de contraseña', () => {
  it('muestra la confirmación como estado accesible al completar la solicitud', async () => {
    authService.requestPasswordReset.mockResolvedValue(undefined)
    const user = setup()
    await user.type(screen.getByLabelText('Correo electrónico'), 'pages@example.test')
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    expect(authService.requestPasswordReset).toHaveBeenCalledWith('pages@example.test')
    const status = await screen.findByRole('status')
    expect(status.textContent).toContain('Si existe una cuenta con ese correo')
    expect(screen.queryByRole('button', { name: 'Enviar enlace' })).toBeNull()
  })

  it('valida el correo vacío sin solicitar recuperación ni mostrar éxito', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    expect((await screen.findByRole('alert')).textContent).toBe('El correo electrónico es obligatorio.')
    expect(screen.queryByRole('status')).toBeNull()
    expect(authService.requestPasswordReset).not.toHaveBeenCalled()
  })

  it('muestra un error accesible y no confirma una solicitud fallida', async () => {
    authService.requestPasswordReset.mockRejectedValue(new Error('Network unavailable'))
    const user = setup()
    await user.type(screen.getByLabelText('Correo electrónico'), 'pages@example.test')
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    expect((await screen.findByRole('alert')).textContent).toBe(
      'No se ha podido enviar el enlace. Inténtalo de nuevo.',
    )
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByRole('button', { name: 'Enviar enlace' }).hasAttribute('disabled')).toBe(false)
  })
})
