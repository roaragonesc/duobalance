import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { Environment } from '../config/environment.js'

export type MailMessage = { to: string; subject: string; text: string }
export type Mailer = (message: MailMessage) => Promise<void>

export function developmentMailer(env: Environment): Mailer {
  if (env.NODE_ENV === 'production') throw new Error('El correo local no está permitido en producción.')
  const directory = resolve(env.MAIL_DIRECTORY)
  return async (message) => {
    const token = message.text.match(/[a-f0-9]{64}$/)?.[0]
    if (token) {
      const path = message.subject === 'Recupera tu contraseña de DuoBalance'
        ? `/reset-password?token=${token}` : `/auth/callback?token_hash=${token}&type=signup`
      message = { ...message, text: `${message.text}\n\n${new URL(path, env.FRONTEND_ORIGIN).toString()}` }
    }
    await mkdir(directory, { recursive: true, mode: 0o700 })
    await writeFile(resolve(directory, `${randomUUID()}.json`), JSON.stringify(message, null, 2), {
      flag: 'wx',
      mode: 0o600,
    })
  }
}
