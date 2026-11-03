import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Onboarding from '../../../src/pages/Onboarding'

const spaceService = vi.hoisted(() => ({
  createSpace: vi.fn(),
  getCurrentSpaceId: vi.fn(),
}))

vi.mock('../../../src/features/spaces/services/spaceService', () => spaceService)
vi.mock('../../../src/features/auth/hooks/useAuth', () => ({
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
  it('TC71_llevaAlDashboardSiElUsuarioYaTieneEspacio', async () => {
    spaceService.getCurrentSpaceId.mockResolvedValue('space-1')
    setup()
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeTruthy()
  })

  it('TC72_muestraElFormularioSiTodaviaNoTieneEspacio', async () => {
    spaceService.getCurrentSpaceId.mockResolvedValue(null)
    setup()
    expect(await screen.findByLabelText('Nombre del espacio')).toBeTruthy()
  })
})
