import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resendConfirmation, signUp } from '../../../../../src/features/auth/services/authService'

const auth = vi.hoisted(() => ({
  signUp: vi.fn(),
  resend: vi.fn(),
}))

vi.mock('../../../../../src/lib/supabase/client', () => ({
  getSupabaseClient: () => ({ auth }),
}))

beforeEach(() => {
  vi.resetAllMocks()
  auth.signUp.mockResolvedValue({ data: { session: null }, error: null })
  auth.resend.mockResolvedValue({ data: {}, error: null })
})

describe('authService', () => {
  it('TC01_signUpRedirigeAlCallbackDelOrigenActual', async () => {
    await signUp({ name: 'Ana', email: 'a@b.es', password: 'Aa123456' })
    expect(auth.signUp.mock.calls[0][0].options.emailRedirectTo).toBe(
      'http://localhost:5173/auth/callback',
    )
  })

  it('TC02_signUpConservaLaRutaDeOrigenEnNext', async () => {
    await signUp({
      name: 'Ana',
      email: 'a@b.es',
      password: 'Aa123456',
      redirectPath: '/join?token=x',
    })
    expect(auth.signUp.mock.calls[0][0].options.emailRedirectTo).toBe(
      'http://localhost:5173/auth/callback?next=%2Fjoin%3Ftoken%3Dx',
    )
  })

  it('TC03_resendConfirmationReenviaElCorreoDeAltaConElMismoCallback', async () => {
    await resendConfirmation('a@b.es')
    expect(auth.resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'a@b.es',
      options: { emailRedirectTo: 'http://localhost:5173/auth/callback' },
    })
  })

  it('TC04_resendConfirmationPropagaLosErroresDeSupabase', async () => {
    const error = new Error('rate limit')
    auth.resend.mockResolvedValue({ data: {}, error })
    await expect(resendConfirmation('a@b.es')).rejects.toBe(error)
  })
})
