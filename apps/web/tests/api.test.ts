import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { http, HttpError, ApiResponseError, setCsrfToken, sessionExpired } from '../src/services/api/http'
import {
  noContent, userResponse, messageResponse, balanceResponse, expensesResponse,
  incomesResponse, dashboardResponse,
} from '../src/services/api/contracts'
import { signIn, signOut, signUp, confirmEmail, updatePassword } from '../src/features/auth/services/authService'
import { getDashboardSummary } from '../src/features/dashboard/dashboardService'
import { getMonthExpenses, getExpense, saveExpense } from '../src/features/expenses/expenseService'
import { getOwnIncome } from '../src/features/incomes/incomeService'
import { getMonthBalance, registerSettlement, SettlementLimitError } from '../src/features/balance/balanceService'
import { getCurrentWorkspace } from '../src/features/spaces/services/spaceService'

const me = '111111111111111111111111'
const partner = '222222222222222222222222'
const spaceId = '333333333333333333333333'
const categoryId = '444444444444444444444444'
const expenseId = '555555555555555555555555'
const token = 'a'.repeat(64)
const nextToken = 'b'.repeat(64)
const user = { id: me, name: 'Prueba', email: 'prueba@example.test', createdAt: '2026-11-01T12:00:00.000Z', confirmed: true }
const pending = { amountCents: 0, debtor: null }
const contribution = { contributionCents: 0, shareBasisPoints: 5000 }
const balance = {
  month: pending, accumulated: pending, members: { me: contribution, partner: contribution },
  summary: { incomesCents: 0, sharedExpensesCents: 0, remainingCents: 0 }, settlements: [],
}
const expense = { id: expenseId, description: 'Compra', date: '2026-11-01', amountCents: 100,
  categoryId, kind: 'shared', paidBy: 'partner', canEdit: false }
const rawExpense = { ...expense, _id: expenseId, createdBy: partner, paidBy: partner }
const categories = { categories: [{ _id: categoryId, key: 'food', icon: 'food' }] }

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })
}

function setup(t: TestContext, handler: (url: string, options: RequestInit) => Response | Promise<Response>) {
  setCsrfToken(null)
  const events: string[] = []
  const redirects: string[] = []
  const calls: { url: string; options: RequestInit }[] = []
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    location: { search: '', origin: 'http://localhost:5173', assign: (url: string) => redirects.push(url) },
    dispatchEvent: (event: Event) => { events.push(event.type); return true },
  } })
  t.mock.method(globalThis, 'fetch', async (url: string | URL | Request, options: RequestInit = {}) => {
    calls.push({ url: String(url), options })
    return handler(String(url), options)
  })
  t.after(() => {
    t.mock.restoreAll()
    setCsrfToken(null)
    if (descriptor) Object.defineProperty(globalThis, 'window', descriptor)
    else Reflect.deleteProperty(globalThis, 'window')
  })
  return { calls, events, redirects }
}

test('concurrent initial mutations share one CSRF request and preserve cookies', async (t) => {
  const { calls } = setup(t, (url) => url.endsWith('/csrf') ? json({ csrfToken: token }) : new Response(null, { status: 204 }))
  await Promise.all([http('/first', noContent, 'DELETE'), http('/second', noContent, 'DELETE')])
  assert.equal(calls.filter((call) => call.url.endsWith('/csrf')).length, 1)
  for (const call of calls.filter((call) => call.options.method === 'DELETE')) {
    assert.equal(new Headers(call.options.headers).get('X-CSRF-Token'), token)
    assert.equal(call.options.credentials, 'include')
  }
})

test('failed CSRF requests can be retried by the user without cached rejection', async (t) => {
  let attempts = 0
  setup(t, (url) => {
    if (url.endsWith('/csrf')) {
      if (++attempts === 1) throw new TypeError('Network unavailable')
      return json({ csrfToken: token })
    }
    return new Response(null, { status: 204 })
  })
  await assert.rejects(http('/expense', noContent, 'DELETE'), TypeError)
  await http('/expense', noContent, 'DELETE')
  assert.equal(attempts, 2)
})

test('late CSRF responses cannot revive an invalidated session', async (t) => {
  let resolveCsrf: (response: Response) => void = () => { throw new Error('Request not started') }
  const response = new Promise<Response>((resolve) => { resolveCsrf = resolve })
  const { calls } = setup(t, () => response)
  const operation = http('/expense', noContent, 'DELETE')
  setCsrfToken(null)
  resolveCsrf(json({ csrfToken: token }))
  await assert.rejects(operation, /sesión ha cambiado/)
  assert.equal(calls.length, 1)
})

test('only an explicit pre-mutation invalid_csrf rejection is retried once', async (t) => {
  let writes = 0
  const { calls } = setup(t, (url) => {
    if (url.endsWith('/csrf')) return json({ csrfToken: nextToken })
    if (++writes === 1) return json({ error: { code: 'invalid_csrf', message: 'Protección inválida' } }, 403)
    return new Response(null, { status: 204 })
  })
  setCsrfToken(token)
  await http('/expense', noContent, 'DELETE')
  assert.equal(writes, 2)
  const sent = calls.filter((call) => call.options.method === 'DELETE')
  assert.equal(new Headers(sent[0].options.headers).get('X-CSRF-Token'), token)
  assert.equal(new Headers(sent[1].options.headers).get('X-CSRF-Token'), nextToken)
})

test('simultaneous stale CSRF rejections share one refresh without invalidating each other', async (t) => {
  const { calls } = setup(t, (url, options) => {
    if (url.endsWith('/csrf')) return json({ csrfToken: nextToken })
    if (new Headers(options.headers).get('X-CSRF-Token') === token) {
      return json({ error: { code: 'invalid_csrf', message: 'Protección inválida' } }, 403)
    }
    return new Response(null, { status: 204 })
  })
  setCsrfToken(token)
  await Promise.all([http('/first', noContent, 'DELETE'), http('/second', noContent, 'DELETE')])
  assert.equal(calls.filter((call) => call.url.endsWith('/csrf')).length, 1)
  assert.equal(calls.filter((call) => call.options.method === 'DELETE').length, 4)
})

test('a repeated CSRF rejection is surfaced instead of looping', async (t) => {
  let writes = 0
  setup(t, (url) => {
    if (url.endsWith('/csrf')) return json({ csrfToken: nextToken })
    writes++
    return json({ error: { code: 'invalid_csrf', message: 'Protección inválida' } }, 403)
  })
  setCsrfToken(token)
  await assert.rejects(http('/expense', noContent, 'DELETE'), HttpError)
  assert.equal(writes, 2)
})

test('an earlier unauthenticated response cannot invalidate a newly logged-in session', async (t) => {
  let resolveResponse: (response: Response) => void = () => { throw new Error('Request not started') }
  const response = new Promise<Response>((resolve) => { resolveResponse = resolve })
  const { events } = setup(t, () => response)
  const request = http('/users/me', userResponse)
  setCsrfToken(nextToken)
  resolveResponse(json({ error: { code: 'not_authenticated', message: 'Inicia sesión' } }, 401))
  await assert.rejects(request, HttpError)
  assert.deepEqual(events, [])
})

test('business conflicts are never automatically retried', async (t) => {
  let writes = 0
  setup(t, () => {
    writes++
    return json({ error: { code: 'settlement_limit', message: 'Supera la deuda' } }, 409)
  })
  setCsrfToken(token)
  await assert.rejects(http('/settlement', noContent, 'POST', {}), (error: unknown) =>
    error instanceof HttpError && error.status === 409 && error.code === 'settlement_limit')
  assert.equal(writes, 1)
})

test('uncertain mutation network failures are never automatically retried', async (t) => {
  let writes = 0
  setup(t, () => { writes++; throw new TypeError('Connection lost after write') })
  setCsrfToken(token)
  await assert.rejects(http('/expense', noContent, 'POST', {}), TypeError)
  assert.equal(writes, 1)
})

test('HTML proxy failures and malformed JSON surface sanitized response errors', async (t) => {
  let attempt = 0
  setup(t, () => ++attempt === 1
    ? new Response('<html>private proxy data</html>', { status: 502 })
    : new Response('{"private":', { headers: { 'Content-Type': 'application/json' } }))
  await assert.rejects(http('/first', messageResponse), (error: unknown) =>
    error instanceof ApiResponseError && !error.message.includes('private'))
  await assert.rejects(http('/second', messageResponse), ApiResponseError)
})

test('successful JSON must satisfy its runtime response contract', async (t) => {
  setup(t, () => json({ user: { id: me } }))
  await assert.rejects(http('/users/me', userResponse), ApiResponseError)
})

test('204 is valid for empty mutations but not for a required data response', async (t) => {
  setup(t, () => new Response(null, { status: 204 }))
  assert.equal(await http('/confirm', noContent), undefined)
  await assert.rejects(http('/users/me', userResponse), ApiResponseError)
})

test('expired sessions emit an event; invalid login does not invalidate a session', async (t) => {
  const { events } = setup(t, () => json({ error: { code: 'not_authenticated', message: 'Inicia sesión' } }, 401))
  await assert.rejects(http('/users/me', userResponse), HttpError)
  await assert.rejects(http('/auth/login', userResponse, 'POST', {}), HttpError)
  assert.deepEqual(events, [sessionExpired])
})

test('login, registration, confirmation and logout use the real API contracts', async (t) => {
  const { calls, events, redirects } = setup(t, (url) => {
    if (url.endsWith('/login')) return json({ user, csrfToken: token })
    if (url.endsWith('/register')) return json({ message: 'Confirmación enviada' }, 202)
    return new Response(null, { status: 204 })
  })
  await signIn({ email: user.email, password: 'Ficticia123!' })
  assert.deepEqual(await signUp({ name: user.name, email: user.email, password: 'Ficticia123!' }), { needsEmailConfirmation: true })
  await confirmEmail(nextToken, 'signup')
  await signOut()
  assert.deepEqual(redirects, ['/login'])
  assert.deepEqual(events, ['duobalance-api-auth-changed', 'duobalance-api-auth-changed'])
  assert.equal(new Headers(calls.at(-1)?.options.headers).get('X-CSRF-Token'), token)
})

test('password reset clears local authentication without making an invalid logout request', async (t) => {
  const { calls, events } = setup(t, () => new Response(null, { status: 204 }))
  Object.defineProperty(window.location, 'search', { value: `?token=${nextToken}` })
  setCsrfToken(token)
  await updatePassword('FicticiaNueva123!')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, '/api/v1/auth/reset-password')
  assert.deepEqual(events, ['duobalance-api-auth-changed'])
})

test('an arbitrary token query parameter never bypasses server logout', async (t) => {
  const { calls } = setup(t, () => new Response(null, { status: 204 }))
  Object.defineProperty(window.location, 'search', { value: `?token=${nextToken}` })
  setCsrfToken(token)
  await signOut()
  assert.equal(calls[0].url, '/api/v1/auth/logout')
})

test('dashboard loads the catalogue once and maps every category and expense', async (t) => {
  const summary = {
    totalCents: 100, previousMonthTotalCents: null, myContributionCents: 50, partnerContributionCents: 50, pending,
    categories: [{ id: categoryId, name: 'Comida', amountCents: 100 }],
    recentExpenses: [expense, { ...expense, id: '666666666666666666666666' }],
  }
  const { calls } = setup(t, (url) => url.endsWith('/categories') ? json(categories) : json(summary))
  const result = await getDashboardSummary(spaceId, '2026-11')
  assert.equal(result?.categories[0].id, 'food')
  assert.deepEqual(result?.recentExpenses.map((item) => item.categoryId), ['food', 'food'])
  assert.equal(calls.filter((call) => call.url.endsWith('/categories')).length, 1)
})

test('expenses retain creator permissions and paid-by identity', async (t) => {
  setup(t, (url) => {
    if (url.endsWith('/categories')) return json(categories)
    if (url.endsWith('/users/me')) return json({ user })
    if (url.includes('?month=')) return json({ expenses: [expense], totalCents: 100, sharedCents: 100, individualCents: 0, pending })
    return json({ expense: rawExpense })
  })
  assert.equal((await getMonthExpenses(spaceId, '2026-11'))?.expenses[0].canEdit, false)
  const result = await getExpense(expenseId)
  assert.equal(result?.paidBy, 'partner')
  assert.equal(result?.canEdit, false)
})

test('expense writes send category IDs and no client ownership fields', async (t) => {
  const { calls } = setup(t, (url) => url.endsWith('/categories') ? json(categories) : json({ expense: rawExpense }, 201))
  setCsrfToken(token)
  await saveExpense(spaceId, { description: 'Compra', amountCents: 100, date: '2026-11-01', categoryId: 'food', kind: 'shared' })
  const body: unknown = JSON.parse(String(calls.at(-1)?.options.body))
  assert.deepEqual(body, { description: 'Compra', amountCents: 100, date: '2026-11-01', categoryId, kind: 'shared', spaceId })
})

test('missing global categories block expense writes explicitly', async (t) => {
  const { calls } = setup(t, () => json({ categories: [] }))
  await assert.rejects(saveExpense(spaceId, { description: 'Compra', amountCents: 100, date: '2026-11-01', categoryId: 'food', kind: 'shared' }), /seed/)
  assert.equal(calls.length, 1)
})

test('own-income editor does not expose another member income as editable', async (t) => {
  setup(t, (url) => url.endsWith('/users/me') ? json({ user }) : json({
    income: { _id: expenseId, createdBy: partner, description: 'Nómina', date: '2026-11-01', amountCents: 100 },
  }))
  assert.equal(await getOwnIncome(expenseId), null)
})

test('balance keeps previous debt visible even without current-month movements', async (t) => {
  setup(t, () => json({ ...balance, accumulated: { amountCents: 100, debtor: 'me' } }))
  assert.equal((await getMonthBalance(spaceId, '2026-11'))?.accumulated.amountCents, 100)
})

test('settlement-limit HTTP rejection preserves its domain-specific error', async (t) => {
  setup(t, () => json({ error: { code: 'settlement_limit', message: 'Supera la deuda' } }, 409))
  setCsrfToken(token)
  await assert.rejects(registerSettlement(spaceId, { amountCents: 100, date: '2026-11-01', note: null }), SettlementLimitError)
})

test('workspace maps owner and partner from validated API identifiers', async (t) => {
  setup(t, (url) => {
    if (url.endsWith('/users/me')) return json({ user })
    if (url.endsWith('/members')) return json({ members: [{ _id: me, name: user.name }, { _id: partner, name: 'Pareja' }] })
    return json({ spaces: [{ _id: spaceId, name: 'Casa', createdBy: me, splitMethod: 'equal', members: [me, partner] }] })
  })
  const result = await getCurrentWorkspace(me)
  assert.equal(result.space?.role, 'owner')
  assert.equal(result.space?.partnerName, 'Pareja')
  assert.equal(result.space?.memberCount, 2)
})

test('financial response contracts reject fractional cents and missing required fields', () => {
  assert.equal(balanceResponse.safeParse(balance).success, true)
  assert.equal(balanceResponse.safeParse({ ...balance, accumulated: { amountCents: 1.5, debtor: 'me' } }).success, false)
  assert.equal(expensesResponse.safeParse({ expenses: [expense], totalCents: 100, sharedCents: 100, individualCents: 0, pending }).success, true)
  assert.equal(incomesResponse.safeParse({ incomes: [], totalCents: 0, myCents: 0, partnerCents: 0 }).success, true)
  assert.equal(incomesResponse.safeParse({ incomes: [], totalCents: '0' }).success, false)
  assert.equal(dashboardResponse.safeParse({ totalCents: 0 }).success, false)
})
