import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  FRONTEND_ORIGIN: z.url(),
  MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\//),
  MONGODB_DATABASE: z.string().regex(/^[a-zA-Z0-9_]+$/),
  MAIL_DIRECTORY: z.string().min(1).default('.local-mail'),
})

export type Environment = z.infer<typeof schema>

/** Valida el entorno privado, el origen y la base aislada; bloquea producción y errores con valores sensibles. */
export function readEnvironment(): Environment {
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    // Validation errors must not include environment values or the MongoDB URI.
    throw new Error(`Configuración inválida: ${parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')}`)
  }
  const env = parsed.data
  const origin = new URL(env.FRONTEND_ORIGIN)
  if (origin.origin !== env.FRONTEND_ORIGIN || !['http:', 'https:'].includes(origin.protocol)) {
    throw new Error('FRONTEND_ORIGIN debe ser un origen HTTP(S), sin rutas.')
  }
  if (env.NODE_ENV === 'production') {
    throw new Error('Producción bloqueada: faltan el adaptador de correo y la validación operativa.')
  }
  const databasePattern = env.NODE_ENV === 'test' ? /^duobalance_test(?:_[a-z0-9]+)?$/ : /^duobalance_dev(?:_[a-z0-9]+)?$/
  if (!databasePattern.test(env.MONGODB_DATABASE)) {
    throw new Error('La base de datos debe tener un nombre separado duobalance_dev o duobalance_test.')
  }
  if (env.NODE_ENV === 'test') {
    const hosts = env.MONGODB_URI.replace(/^mongodb:\/\//, '').split('/')[0]
    if (!/^(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(hosts)) {
      throw new Error('Los tests solo pueden usar MongoDB local aislado, sin credenciales ni Atlas.')
    }
  }
  return env
}
