import { User } from '../models/User.js'
import type { Types } from 'mongoose'

/** Recupera expresamente hash y versión de autenticación para verificar credenciales en el servidor. */
export function findCredentials(email: string) {
  return User.findOne({ email }).select('+passwordHash +authVersion')
}

/** Busca el perfil por ID sin seleccionar los campos de autenticación ocultos. */
export function findProfile(id: string) {
  return User.findById(id)
}

/** Serializa únicamente los campos públicos del usuario con ID y fecha compatibles con el frontend. */
export function publicProfile(user: { _id: Types.ObjectId; name: string; email: string; confirmed: boolean; createdAt: Date }) {
  return {
    id: user._id.toHexString(),
    name: user.name,
    email: user.email,
    confirmed: user.confirmed,
    createdAt: user.createdAt.toISOString(),
  }
}
