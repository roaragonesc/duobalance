import { z } from 'zod'
import * as schema from '../validators/finance.js'

/** Envuelve un esquema como contenido JSON de una respuesta OpenAPI. */
const json = (value: object) => ({ 'application/json': { schema: value } })
const security = [{ session: [] }]
const error = { description: 'Error JSON {error:{code,message,fields?}}; no contiene datos internos.' }
const failures = { 400: error, 401: error, 403: error, 404: error, 409: error, 422: error, 429: error, 500: error }
const documentId = { type: 'string', pattern: '^[a-f0-9]{24}$' }
const date = { type: 'string', format: 'date' }
const cents = { type: 'integer', minimum: 1, maximum: 1000000000 }
const timestamps = { createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } }
/** Define un objeto documentado con todas sus propiedades obligatorias. */
const object = (properties: Record<string, object>) => ({ type: 'object', properties, required: Object.keys(properties) })
/** Define una lista cuyos elementos siguen el esquema indicado. */
const array = (items: object) => ({ type: 'array', items })
/** Referencia un esquema público del catálogo OpenAPI. */
const reference = (name: string) => ({ $ref: `#/components/schemas/${name}` })
const pending = object({ amountCents: { type: 'integer', minimum: 0 }, debtor: { enum: ['me', 'partner', null] } })
export const financeSchemas = {
  Space: object({ _id: documentId, name: { type: 'string' }, createdBy: documentId,
    members: { ...array(documentId), minItems: 1, maxItems: 2 },
    splitMethod: { enum: ['equal', 'proportional'] }, ...timestamps }),
  Category: object({ _id: documentId, name: { type: 'string' }, icon: { type: 'string' },
    color: { type: 'string', pattern: '^#[a-fA-F0-9]{6}$' }, ownerId: { anyOf: [documentId, { type: 'null' }] }, ...timestamps }),
  Expense: object({ _id: documentId, spaceId: documentId, createdBy: documentId, paidBy: documentId,
    description: { type: 'string' }, amountCents: cents, date, categoryId: documentId,
    kind: { enum: ['shared', 'individual'] }, ownerBasisPoints: { type: 'integer', minimum: 0, maximum: 10000 }, ...timestamps }),
  Income: object({ _id: documentId, spaceId: documentId, createdBy: documentId,
    description: { type: 'string' }, amountCents: cents, date, ...timestamps }),
  Settlement: object({ _id: documentId, spaceId: documentId, createdBy: documentId, fromUserId: documentId, toUserId: documentId,
    amountCents: cents, date, note: { type: ['string', 'null'] }, ...timestamps }),
  Invitation: object({ _id: documentId, spaceId: documentId, invitedBy: documentId, invitedEmail: { type: 'string', format: 'email' },
    status: { enum: ['pending', 'accepted', 'rejected'] }, expiresAt: { type: 'string', format: 'date-time' }, ...timestamps }),
  PendingBalance: pending,
}
/** Selecciona el esquema de respuesta documentado; conserva una descripción genérica donde no hay forma específica. */
function resultSchema(description: string): object {
  for (const [key, name] of [
    ['spaces', 'Space'], ['space', 'Space'], ['categories', 'Category'], ['category', 'Category'],
    ['expenses', 'Expense'], ['expense', 'Expense'], ['income', 'Income'], ['settlements', 'Settlement'],
    ['settlement', 'Settlement'], ['invitations', 'Invitation'],
  ]) {
    if (description.startsWith(`{${key}:`)) {
      return object({ [key]: key.endsWith('s') ? array(reference(name)) : reference(name) })
    }
  }
  if (description.startsWith('{spaceId}')) return object({ spaceId: documentId })
  if (description.startsWith('ExpenseMonth:') || description.startsWith('Mismo ExpenseMonth')) {
    return object({
      expenses: array(object({ id: documentId, spaceId: documentId, description: { type: 'string' }, amountCents: cents,
        date, categoryId: documentId, kind: { enum: ['shared', 'individual'] },
        paidBy: { enum: ['me', 'partner'] }, canEdit: { type: 'boolean' } })),
      totalCents: { type: 'integer' }, sharedCents: { type: 'integer' }, individualCents: { type: 'integer' }, pending,
    })
  }
  return { type: 'object', description }
}
const origin = { in: 'header', name: 'Origin', required: true, schema: { type: 'string' } }
const csrf = { in: 'header', name: 'X-CSRF-Token', required: true, schema: { type: 'string' } }
const resourceId = { in: 'path', name: 'id', required: true, schema: { type: 'string', pattern: '^[a-f0-9]{24}$' } }
const token = { in: 'path', name: 'token', required: true, schema: { type: 'string', pattern: '^[a-f0-9]{64}$' } }
const month = { in: 'query', name: 'month', required: true, schema: { type: 'string', pattern: '^\\d{4}-(0[1-9]|1[0-2])$' } }
const space = { in: 'query', name: 'spaceId', required: true, schema: resourceId.schema }
const filter = [
  { in: 'query', name: 'kind', schema: { type: 'string', enum: ['shared', 'individual'] } },
  { in: 'query', name: 'categoryId', schema: resourceId.schema },
]
/** Construye la documentación de una lectura autenticada con sus parámetros y errores posibles. */
const get = (description: string, parameters: object[] = []) => ({
  security, parameters, responses: { 200: { description, content: json(resultSchema(description)) }, ...failures },
})
/** Documenta una mutación con origen, CSRF, entrada Zod y respuesta con contenido o 204. */
const write = (description: string, input: z.ZodType | null, parameters: object[] = [], status = 200) => ({
  security, parameters: [...parameters, origin, csrf],
  ...(input ? { requestBody: { required: true, content: json(z.toJSONSchema(input, { unrepresentable: 'any' })) } } : {}),
  responses: { [status]: { description, ...(status === 204 ? {} : { content: json(resultSchema(description)) }) }, ...failures },
})

export const financePaths = {
  '/spaces': {
    get: get('{spaces: Space[]}; solo el espacio del usuario'),
    post: write('{space: Space}; máximo un espacio por usuario', schema.createSpace, [], 201),
  },
  '/spaces/{id}': {
    get: get('{space: Space}; solo miembros', [resourceId]),
    patch: write('{space: Space}; solo creador; no cambia snapshots históricos', schema.updateSpace, [resourceId]),
    delete: write('204; solo creador, sin gastos, ingresos ni liquidaciones', null, [resourceId], 204),
  },
  '/spaces/{id}/members': { get: get('{members: [{_id,name,email}]}; solo miembros', [resourceId]) },
  '/spaces/{id}/invitations': {
    post: write('{invitation:{_id,spaceId,invitedEmail,status,expiresAt},token}; token aleatorio de un uso, 7 días; nunca tokenHash',
      schema.invite, [resourceId], 201),
  },
  '/invitations': { get: get('{invitations: Invitation[]}; solo destinatario o creador del espacio; sin tokenHash') },
  '/invitations/{token}/accept': {
    post: write('{spaceId}; exige correo coincidente, espacio libre y menos de dos miembros, transacción atómica', null, [token]),
  },
  '/invitations/{token}/reject': { post: write('{spaceId}; solo destinatario; consume token', null, [token]) },
  '/categories': {
    get: get('{categories: Category[]}; globales y propias; las de la pareja se muestran solo en el resumen de gastos compartidos'),
    post: write('{category: Category}; personal del usuario', schema.category, [], 201),
  },
  '/categories/{id}': {
    patch: write('{category: Category}; solo propietario; campos completos', schema.category, [resourceId]),
    delete: write('204; solo propietario; 409 si está en uso; globales inmutables', null, [resourceId], 204),
  },
  '/expenses': {
    get: get('ExpenseMonth: {expenses:[{id,spaceId,description,amountCents,date,categoryId,kind,paidBy,canEdit}],totalCents,sharedCents,individualCents,pending}; privados solo creador; fecha descendente y creación descendente', [space, month, ...filter]),
    post: write('{expense: Expense}; paidBy/createdBy desde sesión; snapshot de reparto; céntimos enteros',
      schema.expense.extend({ spaceId: schema.id }), [], 201),
  },
  '/expenses/{id}': {
    get: get('{expense: Expense}; privados ajenos devuelven 404', [resourceId]),
    patch: write('{expense: Expense}; campos completos; solo creador; kind inmutable, proporción histórica conservada', schema.expense, [resourceId]),
    delete: write('204; solo creador, conserva liquidaciones', null, [resourceId], 204),
  },
  '/spaces/{id}/expenses': { get: get('Mismo ExpenseMonth que GET /expenses', [resourceId, month, ...filter]) },
  '/incomes': {
    get: get('{incomes:[{id,description,date,amountCents,owner}],totalCents,myCents,partnerCents}; ambos miembros pueden consultar', [space, month]),
    post: write('{income: Income}; propietario desde sesión', schema.income.extend({ spaceId: schema.id }), [], 201),
  },
  '/incomes/{id}': {
    get: get('{income: Income}; solo miembros del espacio', [resourceId]),
    patch: write('{income: Income}; campos completos, solo propietario', schema.income, [resourceId]),
    delete: write('204; solo propietario; no recalcula repartos históricos', null, [resourceId], 204),
  },
  '/spaces/{id}/incomes': { get: get('Mismo resultado que GET /incomes', [resourceId, month]) },
  '/spaces/{id}/balance': {
    get: get('BalanceMonth: {month,accumulated,members:{me,partner},summary:{incomesCents,sharedExpensesCents,remainingCents},settlements}; PendingBalance={amountCents,debtor:me|partner|null}; MemberContribution={contributionCents,shareBasisPoints}; privados excluidos', [resourceId, month]),
  },
  '/spaces/{id}/summary': {
    get: get('DashboardSummary: {totalCents,previousMonthTotalCents,myContributionCents,partnerContributionCents,pending,categories:[{id,name,amountCents}],recentExpenses}; solo compartidos', [resourceId, month]),
  },
  '/spaces/{id}/settlements': {
    get: get('{settlements: Settlement[]}; historial íntegro, solo miembros', [resourceId]),
    post: write('{settlement: Settlement}; deuda a fecha de pago; parcial; no mayor que deuda; serializa pagos concurrentes; ambos miembros pueden registrar el pago del deudor', schema.settlement, [resourceId], 201),
  },
  '/settlements/{id}': { get: get('{settlement: Settlement}; solo miembros', [resourceId]) },
}
