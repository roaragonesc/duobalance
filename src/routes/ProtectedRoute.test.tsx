import type { Session } from '@supabase/supabase-js'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AuthContext, type AuthState } from '../features/auth/authContext'
import ProtectedRoute from './ProtectedRoute'

function CurrentLocation({ name }: { name: string }) {
  const location = useLocation()
  return (
    <>
      <h1>{name}</h1>
      <p>{`${location.pathname}${location.search}${location.hash}`}</p>
      <p>{JSON.stringify(location.state)}</p>
    </>
  )
}

function setup(url: string, auth: AuthState) {
  const router = createMemoryRouter(
    [
      {
        element: <ProtectedRoute />,
        children: [{ path: '/onboarding', element: <h1>Onboarding</h1> }],
      },
      { path: '/login', element: <CurrentLocation name="Login" /> },
      { path: '/auth/callback', element: <CurrentLocation name="Callback" /> },
    ],
    { initialEntries: [url] },
  )
  render(
    <AuthContext value={auth}>
      <RouterProvider router={router} />
    </AuthContext>,
  )
}

describe('ProtectedRoute', () => {
  it('sin sesión redirige al login recordando la ruta', () => {
    setup('/onboarding', { status: 'unauthenticated' })
    expect(screen.getByRole('heading', { name: 'Login' })).toBeTruthy()
    expect(screen.getByText('{"from":"/onboarding"}')).toBeTruthy()
  })

  it('mientras comprueba la sesión no muestra la pantalla protegida', () => {
    setup('/onboarding', { status: 'loading' })
    expect(screen.getByRole('status').textContent).toContain('Comprobando sesión')
    expect(screen.queryByRole('heading', { name: 'Onboarding' })).toBeNull()
  })

  it('con sesión muestra la pantalla', () => {
    setup('/onboarding', {
      status: 'authenticated',
      session: { user: { id: 'u' } } as Session,
    })
    expect(screen.getByRole('heading', { name: 'Onboarding' })).toBeTruthy()
  })

  it('un enlace de correo fallido va al callback conservando el error', () => {
    setup('/onboarding?error=access_denied&error_code=otp_expired', {
      status: 'unauthenticated',
    })
    expect(screen.getByRole('heading', { name: 'Callback' })).toBeTruthy()
    expect(
      screen.getByText('/auth/callback?error=access_denied&error_code=otp_expired'),
    ).toBeTruthy()
  })
})
