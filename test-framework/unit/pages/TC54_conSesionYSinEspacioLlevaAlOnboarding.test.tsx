import type { Session } from '@supabase/supabase-js'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthError } from '@supabase/supabase-js'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthState } from '../../../src/features/auth/authContext'
import AuthCallback from '../../../src/pages/AuthCallback'

const authService = vi.hoisted(() => ({
  confirmEmail: vi.fn(),
  resendConfirmation: vi.fn(),
}))
const spaceService = vi.hoisted(() => ({ getCurrentSpaceId: vi.fn() }))

vi.mock('../../../src/features/auth/services/authService', () => authService)
vi.mock('../../../src/features/spaces/services/spaceService', () => spaceService)

const authenticated: AuthState = {
  status: 'authenticated',
  session: { user: { id: 'user-1' } } as Session,
}
const unauthenticated: AuthState = { status: 'unauthenticated' }

function setup(url: string, auth: AuthState) {
  const router = createMemoryRouter(
    [
      { path: '/auth/callback', element: <AuthCallback /> },
      { path: '/onboarding', element: <h1>Onboarding</h1> },
      { path: '/dashboard', element: <h1>Dashboard</h1> },
      { path: '/join', element: <h1>Unirse</h1> },
      { path: '/login', element: <h1>Login</h1> },
    ],
    { initialEntries: [url] },
  )
  const view = (state: AuthState) => (
    <AuthContext value={state}>
      <RouterProvider router={router} />
    </AuthContext>
  )
  const result = render(view(auth))
  return { router, setAuth: (state: AuthState) => result.rerender(view(state)) }
}

beforeEach(() => {
  vi.resetAllMocks()
  spaceService.getCurrentSpaceId.mockResolvedValue(null)
})

describe('confirmación correcta', () => {
  it('TC54_conSesionYSinEspacioLlevaAlOnboarding', async () => {
    setup('/auth/callback?code=abc', authenticated)
    expect(await screen.findByRole('heading', { name: 'Onboarding' })).toBeTruthy()
    expect(spaceService.getCurrentSpaceId).toHaveBeenCalledWith('user-1')
  })

  it('TC55_conEspacioLlevaAlDashboard', async () => {
    spaceService.getCurrentSpaceId.mockResolvedValue('space-1')
    setup('/auth/callback?code=abc&next=%2Fonboarding', authenticated)
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeTruthy()
  })

  it('TC56_respetaLaRutaDeOrigenInvitacion', async () => {
    setup('/auth/callback?code=abc&next=%2Fjoin%3Ftoken%3Dx', authenticated)
    expect(await screen.findByRole('heading', { name: 'Unirse' })).toBeTruthy()
  })

  it('TC57_ignoraRutasExternasEnNext', async () => {
    setup('/auth/callback?code=abc&next=%2F%2Fevil.example', authenticated)
    expect(await screen.findByRole('heading', { name: 'Onboarding' })).toBeTruthy()
  })

  it('TC58_conTokenHashConfirmaSoloTrasPulsarElBoton', async () => {
    authService.confirmEmail.mockResolvedValue(undefined)
    const { setAuth } = setup('/auth/callback?token_hash=hash&type=signup', unauthenticated)
    expect(authService.confirmEmail).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar mi correo' }))
    expect(authService.confirmEmail).toHaveBeenCalledWith('hash', 'signup')
    setAuth(authenticated)
    expect(await screen.findByRole('heading', { name: 'Onboarding' })).toBeTruthy()
  })
})

describe('enlaces fallidos', () => {
  it('TC59_muestraEnlaceCaducadoConOtpExpiredEnLaQuery', async () => {
    setup(
      '/auth/callback?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
      unauthenticated,
    )
    expect(
      screen.getByRole('heading', { name: 'Enlace caducado o ya utilizado' }),
    ).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ir al inicio de sesión' })).toBeTruthy()
  })

  it('TC60_muestraEnlaceCaducadoConOtpExpiredEnElHash', () => {
    setup('/auth/callback#error=access_denied&error_code=otp_expired', unauthenticated)
    expect(
      screen.getByRole('heading', { name: 'Enlace caducado o ya utilizado' }),
    ).toBeTruthy()
  })

  it('TC61_noRedirigeAunqueHayaSesionSiElEnlaceHaFallado', () => {
    setup('/auth/callback?error=access_denied&error_code=otp_expired', authenticated)
    expect(screen.getByRole('heading', { name: 'Enlace caducado o ya utilizado' })).toBeTruthy()
    expect(spaceService.getCurrentSpaceId).not.toHaveBeenCalled()
  })

  it('TC62_codigoSinSesionIndicaQueSeAbraEnElMismoNavegador', () => {
    setup('/auth/callback?code=abc', unauthenticated)
    expect(
      screen.getByRole('heading', { name: 'No se ha podido iniciar tu sesión' }),
    ).toBeTruthy()
  })

  it('TC63_tokenHashCaducadoMuestraElError', async () => {
    authService.confirmEmail.mockRejectedValue(
      new AuthError('Token has expired or is invalid', 403, 'otp_expired'),
    )
    setup('/auth/callback?token_hash=hash&type=signup', unauthenticated)
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar mi correo' }))
    expect(
      await screen.findByRole('heading', { name: 'Enlace caducado o ya utilizado' }),
    ).toBeTruthy()
  })

  it('TC64_sinParametrosEsUnEnlaceNoValido', () => {
    setup('/auth/callback', unauthenticated)
    expect(screen.getByRole('heading', { name: 'Enlace no válido' })).toBeTruthy()
  })
})

describe('reenvío del correo de confirmación', () => {
  it('TC65_reenviaConservaLaRutaDeOrigenYBloqueaReenviosSeguidos', async () => {
    authService.resendConfirmation.mockResolvedValue(undefined)
    setup('/auth/callback?error_code=otp_expired&next=%2Fjoin%3Ftoken%3Dx', unauthenticated)
    await userEvent.type(screen.getByLabelText('Correo electrónico'), ' ana@example.test ')
    await userEvent.click(
      screen.getByRole('button', { name: 'Reenviar correo de confirmación' }),
    )
    expect(authService.resendConfirmation).toHaveBeenCalledWith(
      'ana@example.test',
      '/join?token=x',
    )
    expect((await screen.findByRole('status')).textContent).toContain(
      'te hemos enviado un enlace nuevo',
    )
    const button = screen.getByRole('button', { name: /Podrás reenviarlo en 60 s/ })
    expect(button).toHaveProperty('disabled', true)
  })

  it('TC66_validaElCorreoAntesDeEnviar', async () => {
    setup('/auth/callback?error_code=otp_expired', unauthenticated)
    await userEvent.click(
      screen.getByRole('button', { name: 'Reenviar correo de confirmación' }),
    )
    expect(authService.resendConfirmation).not.toHaveBeenCalled()
    expect(screen.getByText('El correo electrónico es obligatorio.')).toBeTruthy()
  })

  it('TC67_muestraElLimiteDeEnviosDeSupabase', async () => {
    authService.resendConfirmation.mockRejectedValue(
      new AuthError('rate limit', 429, 'over_email_send_rate_limit'),
    )
    setup('/auth/callback?error_code=otp_expired', unauthenticated)
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@example.test')
    await userEvent.click(
      screen.getByRole('button', { name: 'Reenviar correo de confirmación' }),
    )
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Se han enviado demasiados correos. Espera unos minutos e inténtalo de nuevo.',
    )
  })
})
