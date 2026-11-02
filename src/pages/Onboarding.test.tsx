import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Onboarding from './Onboarding'

const spaceService = vi.hoisted(() => ({
  createSpace: vi.fn(),
  getCurrentSpaceId: vi.fn(),
}))

vi.mock('../features/spaces/services/spaceService', () => spaceService)
vi.mock('../features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    status: 'authenticated',
    session: { user: { id: 'user-1' } },
  }),
}))

function setup() {
  const router = createMemoryRouter(
    [
      { path: '/onboarding', element: <Onboarding /> },
      { path: '/dashboard', element: <h1>Dashboard</h1> },
    ],
    { initialEntries: ['/onboarding'] },
  )
  render(<RouterProvider router={router} />)
}

beforeEach(() => vi.resetAllMocks())

describe('Onboarding', () => {
  it('lleva al dashboard si el usuario ya tiene espacio', async () => {
    spaceService.getCurrentSpaceId.mockResolvedValue('space-1')
    setup()
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeTruthy()
  })

  it('muestra el formulario si todavía no tiene espacio', async () => {
    spaceService.getCurrentSpaceId.mockResolvedValue(null)
    setup()
    expect(await screen.findByLabelText('Nombre del espacio')).toBeTruthy()
  })
})
