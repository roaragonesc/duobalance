import { test as base, send } from './financeApi'

export const today = () => new Date().toISOString().slice(0, 10)

export const test = base.extend<{
  registeredAccount: void
  confirmedAccount: void
  authenticatedAccount: { csrf: string }
  pendingInvitation: { spaceId: string; token: string }
  expense: { id: string; input: { categoryId: string; description: string; amountCents: number; date: string; kind: 'shared' } }
  income: { id: string; input: { description: string; amountCents: number; date: string } }
  settlementId: string
}>({
  registeredAccount: async ({ request, account }, provideFixtures) => {
    const response = await request.post('auth/register', { data: account })
    if (response.status() !== 202) throw new Error(`Preparación registro: HTTP ${response.status()}`)
    await provideFixtures()
  },
  confirmedAccount: async ({ request, registeredAccount: _registered, mailToken }, provideFixtures) => {
    const response = await request.post('auth/confirm-email', {
      data: { token: await mailToken('Confirma tu cuenta de DuoBalance') },
    })
    if (response.status() !== 204) throw new Error(`Preparación confirmación: HTTP ${response.status()}`)
    await provideFixtures()
  },
  authenticatedAccount: async ({ request, account, confirmedAccount: _confirmed }, provideFixtures) => {
    const response = await request.post('auth/login', { data: { email: account.email, password: account.password } })
    if (response.status() !== 200) throw new Error(`Preparación login: HTTP ${response.status()}`)
    await provideFixtures({ csrf: (await response.json()).csrfToken })
  },
  pendingInvitation: async ({ actors }, provideFixtures) => {
    const space = await send(actors.a, 'post', 'spaces', { name: 'Invitación aislada', splitMethod: 'equal' })
    if (space.status() !== 201) throw new Error(`Preparación espacio: HTTP ${space.status()}`)
    const spaceId = (await space.json()).space._id
    const invitation = await send(actors.a, 'post', `spaces/${spaceId}/invitations`, { email: actors.b.email })
    if (invitation.status() !== 201) throw new Error(`Preparación invitación: HTTP ${invitation.status()}`)
    await provideFixtures({ spaceId, token: (await invitation.json()).token })
  },
  expense: async ({ household }, provideFixtures) => {
    const input = {
      categoryId: household.categoryId, description: 'Gasto endpoint', amountCents: 8000, date: today(), kind: 'shared' as const,
    }
    const response = await send(household.a, 'post', 'expenses', { ...input, spaceId: household.spaceId })
    if (response.status() !== 201) throw new Error(`Preparación gasto: HTTP ${response.status()}`)
    await provideFixtures({ id: (await response.json()).expense._id, input })
  },
  income: async ({ household }, provideFixtures) => {
    const input = { description: 'Ingreso endpoint', amountCents: 90000, date: today() }
    const response = await send(household.a, 'post', 'incomes', { ...input, spaceId: household.spaceId })
    if (response.status() !== 201) throw new Error(`Preparación ingreso: HTTP ${response.status()}`)
    await provideFixtures({ id: (await response.json()).income._id, input })
  },
  settlementId: async ({ household, expense: _expense }, provideFixtures) => {
    const response = await send(household.a, 'post', `spaces/${household.spaceId}/settlements`, {
      date: today(), amountCents: 1000, note: 'Pago endpoint',
    })
    if (response.status() !== 201) throw new Error(`Preparación liquidación: HTTP ${response.status()}`)
    await provideFixtures((await response.json()).settlement._id)
  },
})

export { expect, send } from './financeApi'
