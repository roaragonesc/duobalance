import { financePaths, financeSchemas } from './financeOpenApi.js'

/** Envuelve el esquema público de una operación en contenido application/json. */
const json = (schema: object) => ({ 'application/json': { schema } })
/** Referencia un componente del catálogo OpenAPI sin duplicar su definición. */
const reference = (name: string) => ({ $ref: `#/components/schemas/${name}` })
/** Describe una respuesta HTTP con un esquema de contenido opcional. */
const response = (description: string, schema?: object) => ({
  description, ...(schema ? { content: json(schema) } : {}),
})
const errors = {
  400: response('Entrada o token inválido', reference('Error')),
  403: response('Origen o CSRF no permitido', reference('Error')),
  415: response('Se requiere application/json', reference('Error')),
  429: response('Límite de solicitudes', reference('Error')),
  500: response('Error interno; no se devuelven detalles sensibles', reference('Error')),
}
const authenticated = [{ session: [] }]
const csrfHeader = { in: 'header', name: 'X-CSRF-Token', required: true, schema: { type: 'string' } }
const originHeader = { in: 'header', name: 'Origin', required: true,
  description: 'Debe coincidir exactamente con FRONTEND_ORIGIN.', schema: { type: 'string' } }
/** Describe un cuerpo JSON obligatorio de entrada. */
const body = (schema: object) => ({ required: true, content: json(schema) })
/** Define un objeto de contrato sin propiedades adicionales y con campos obligatorios explícitos. */
const object = (properties: Record<string, object>, required = Object.keys(properties)) => ({
  type: 'object', additionalProperties: false, properties, required,
})
const email = { type: 'string', format: 'email', maxLength: 254 }
const name = { type: 'string', minLength: 1, maxLength: 80 }
const password = { type: 'string', minLength: 8, maxLength: 128,
  description: 'Incluye una mayúscula Unicode, una minúscula Unicode y un número.' }
const token = { type: 'string', pattern: '^[a-f0-9]{64}$' }
const message = object({ message: { type: 'string' } })
const profileResponse = object({ user: reference('User') })
/** Documenta un POST con origen y, cuando es protegido, sesión y CSRF. */
const post = (schema: object, success: number, result: object, protectedRoute = false) => ({
  parameters: [originHeader, ...(protectedRoute ? [csrfHeader] : [])],
  ...(protectedRoute ? { security: authenticated } : {}),
  requestBody: body(schema),
  responses: { [success]: result, ...errors,
    ...(protectedRoute ? { 401: response('Sesión ausente, caducada o revocada', reference('Error')) } : {}) },
})

export const openApi = {
  openapi: '3.1.0',
  info: { title: 'DuoBalance API — módulo inicial', version: '0.1.0',
    description: 'Autenticación, perfiles, espacios, invitaciones, categorías, gastos, ingresos, balances y liquidaciones. Cliente React integrado; configuración y verificación Atlas pendientes.' },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: { session: { type: 'apiKey', in: 'cookie', name: 'duobalance-session' } },
    schemas: {
      ...financeSchemas,
      User: object({
        id: { type: 'string' }, name, email, confirmed: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
      }),
      Error: object({ error: object({
        code: { type: 'string' }, message: { type: 'string' },
        fields: { type: 'array', items: { type: 'string' } },
      }, ['code', 'message']) }),
    },
  },
  paths: {
    ...financePaths,
    '/health': { get: { responses: {
      200: response('MongoDB conectado', object({ status: { const: 'ok' } })),
      503: response('MongoDB no disponible', object({ status: { const: 'unavailable' } })),
    } } },
    '/api-docs': { get: { responses: { 200: response('Este documento OpenAPI en JSON') } } },
    '/auth/register': { post: post(object({ name, email, password }), 202, response('Respuesta genérica', message)) },
    '/auth/resend-confirmation': { post: post(object({ email }), 202, response('Respuesta genérica', message)) },
    '/auth/confirm-email': { post: post(object({ token }), 204, response('Correo confirmado; token consumido')) },
    '/auth/login': { post: {
      ...post(object({ email, password: { type: 'string', minLength: 1, maxLength: 128 } }),
        200, response('Cookie HttpOnly y token CSRF', object({ user: reference('User'), csrfToken: token }))),
      responses: {
        200: response('Cookie HttpOnly y token CSRF', object({ user: reference('User'), csrfToken: token })),
        401: response('Credenciales incorrectas o cuenta sin confirmar', reference('Error')),
        ...errors,
      },
    } },
    '/auth/logout': { post: { security: authenticated, parameters: [originHeader, csrfHeader],
      responses: { 204: response('Sesión invalidada y cookie eliminada'),
        401: response('Sin sesión válida', reference('Error')), ...errors } } },
    '/auth/me': { get: { security: authenticated, responses: {
      200: response('Perfil propio', profileResponse), 401: response('Sin sesión válida', reference('Error')),
    } } },
    '/auth/csrf': { get: { security: authenticated,
      description: 'Renueva el token CSRF de esta sesión; el token anterior deja de ser válido.',
      responses: { 200: response('Nuevo token CSRF', object({ csrfToken: token })),
        401: response('Sin sesión válida', reference('Error')) } } },
    '/auth/forgot-password': { post: post(object({ email }), 202, response('Respuesta genérica', message)) },
    '/auth/reset-password': { post: post(object({ token, password }), 204,
      response('Contraseña cambiada; todas las sesiones anteriores quedan invalidadas')) },
    '/users/me': {
      get: { security: authenticated, responses: {
        200: response('Perfil propio', profileResponse), 401: response('Sin sesión válida', reference('Error')),
      } },
      patch: post(object({ name }), 200, response('Perfil actualizado', profileResponse), true),
    },
    '/users': { get: { security: authenticated,
      parameters: [{ in: 'query', name: 'email', required: true, schema: email }],
      description: 'Búsqueda exacta de correo de una cuenta confirmada para invitar. No admite directorio, regex ni paginación.',
      responses: { 200: response('Cero o un usuario; datos mínimos', object({
        users: { type: 'array', maxItems: 1, items: object({ id: { type: 'string' }, name, email }) },
      })), 401: response('Sin sesión válida', reference('Error')), ...errors },
    } },
  },
}
