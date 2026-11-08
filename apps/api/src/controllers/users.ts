import type { RequestHandler } from 'express'
import { currentSession } from '../middlewares/session.js'
import { User } from '../models/User.js'
import { findProfile, publicProfile } from '../repositories/users.js'
import { ApiError } from '../utils/ApiError.js'
import { profileUpdate, userSearch } from '../validators/auth.js'

/** GET /users/me o /auth/me: devuelve el perfil público de la sesión actual. */
export const me: RequestHandler = async (request, response) => {
  const user = await findProfile(currentSession(request).userId)
  if (!user) throw new ApiError(401, 'not_authenticated', 'Debes iniciar sesión.')
  response.json({ user: publicProfile(user) })
}

/** PATCH /users/me: valida y actualiza únicamente el nombre del usuario autenticado. */
export const updateMe: RequestHandler = async (request, response) => {
  const input = profileUpdate.parse(request.body)
  const user = await User.findByIdAndUpdate(currentSession(request).userId,
    { $set: { name: input.name } }, { new: true, runValidators: true })
  if (!user) throw new ApiError(401, 'not_authenticated', 'Debes iniciar sesión.')
  response.json({ user: publicProfile(user) })
}

/** GET /users?email=…: busca un correo exacto confirmado sin ofrecer un directorio global de usuarios. */
export const search: RequestHandler = async (request, response) => {
  const { email } = userSearch.parse(request.query)
  const user = await User.findOne({ email, confirmed: true })
  response.json({ users: user ? [{ id: user._id.toHexString(), name: user.name, email: user.email }] : [] })
}
