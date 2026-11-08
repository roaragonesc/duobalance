import { User } from '../models/User.js'
import type { Types } from 'mongoose'

export function findCredentials(email: string) {
  return User.findOne({ email }).select('+passwordHash +authVersion')
}

export function findProfile(id: string) {
  return User.findById(id)
}

export function publicProfile(user: { _id: Types.ObjectId; name: string; email: string; confirmed: boolean; createdAt: Date }) {
  return {
    id: user._id.toHexString(),
    name: user.name,
    email: user.email,
    confirmed: user.confirmed,
    createdAt: user.createdAt.toISOString(),
  }
}
