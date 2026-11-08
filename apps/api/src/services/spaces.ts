import mongoose from 'mongoose'
import { Space, Invitation, Expense, Income, Settlement } from '../models/finance.js'
import { User } from '../models/User.js'
import { memberSpace, missing, mutateSpace, ownerOnly } from '../repositories/finance.js'
import { ApiError } from '../utils/ApiError.js'
import { createToken, hashToken } from '../utils/tokens.js'

/** Crea un espacio con el usuario como único miembro y rechaza una segunda pertenencia. */
export async function createSpace(userId: string, input: { name: string; splitMethod: 'equal' | 'proportional' }) {
  if (await Space.exists({ members: userId })) throw new ApiError(409, 'already_in_space', 'Ya perteneces a un espacio.')
  return Space.create({ ...input, createdBy: userId, members: [userId] })
}

/** Obtiene el espacio solo si el usuario pertenece a él. */
export async function getSpace(userId: string, spaceId: string) {
  return memberSpace(spaceId, userId)
}

/** Devuelve nombres y correos de los miembros, sin credenciales ni tokens. */
export async function members(userId: string, spaceId: string) {
  const space = await memberSpace(spaceId, userId)
  return User.find({ _id: { $in: space.members } }).select('name email')
}

/** Permite al creador cambiar nombre o reparto global sin alterar los snapshots de gastos existentes. */
export async function updateSpace(userId: string, spaceId: string, input: { name?: string; splitMethod?: 'equal' | 'proportional' }) {
  return mutateSpace(spaceId, userId, async (space, session) => {
    ownerOnly(space, userId)
    if (input.name !== undefined) space.name = input.name
    if (input.splitMethod !== undefined) space.splitMethod = input.splitMethod
    await space.save({ session })
    return space
  })
}

/** Borra el espacio y sus invitaciones solo por su creador y si no existe historial financiero. */
export async function deleteSpace(userId: string, spaceId: string) {
  return mutateSpace(spaceId, userId, async (space, session) => {
    ownerOnly(space, userId)
    for (const model of [Expense, Income, Settlement]) {
      if (await model.exists({ spaceId }).session(session)) {
        throw new ApiError(409, 'space_has_history', 'No se puede borrar un espacio con historial.')
      }
    }
    await Invitation.deleteMany({ spaceId }).session(session)
    await Space.deleteOne({ _id: spaceId }).session(session)
  })
}

/** Crea una invitación limitada al correo, con siete días de validez, y entrega su token una única vez. */
export async function invite(userId: string, spaceId: string, email: string) {
  const value = createToken()
  const invitation = await mutateSpace(spaceId, userId, async (space, session) => {
    ownerOnly(space, userId)
    if (space.members.length >= 2) throw new ApiError(409, 'space_full', 'Este espacio ya tiene dos miembros.')
    const user = await User.findById(userId).session(session)
    if (user?.email === email) throw new ApiError(400, 'cannot_invite_self', 'No puedes invitarte a ti mismo.')
    const count = await Invitation.countDocuments({ spaceId, status: 'pending', expiresAt: { $gt: new Date() } }).session(session)
    if (count >= 10) throw new ApiError(429, 'too_many_invitations', 'Hay demasiadas invitaciones pendientes.')
    const [created] = await Invitation.create([{
      spaceId, invitedBy: userId, invitedEmail: email, tokenHash: hashToken(value),
      expiresAt: new Date(Date.now() + 7 * 86400000),
    }], { session })
    return created
  })
  return { invitation: {
    _id: invitation._id.toString(), spaceId: invitation.spaceId.toString(),
    invitedEmail: invitation.invitedEmail, status: invitation.status, expiresAt: invitation.expiresAt,
  }, token: value }
}

/** Lista invitaciones dirigidas al usuario o pertenecientes al espacio del que es creador. */
export async function listInvitations(userId: string) {
  const user = await User.findById(userId)
  if (!user) throw missing()
  const own = await Space.findOne({ createdBy: userId })
  return Invitation.find({ $or: [{ invitedEmail: user.email }, ...(own ? [{ spaceId: own._id }] : [])] })
    .sort({ createdAt: -1 })
}

/** Acepta o rechaza un token vigente del destinatario; la aceptación respeta el máximo de dos miembros. */
export async function respond(userId: string, value: string, accept: boolean) {
  const invitation = await Invitation.findOne({ tokenHash: hashToken(value) })
  if (!invitation) throw missing()
  return mutateSpace(invitation.spaceId.toString(), invitation.invitedBy.toString(), async (space, session) => {
    const current = await Invitation.findOne({
      _id: invitation._id, tokenHash: hashToken(value), status: 'pending', expiresAt: { $gt: new Date() },
    }).session(session)
    const user = await User.findById(userId).session(session)
    if (!current || !user || user.email !== current.invitedEmail) throw missing()
    if (accept) {
      if (await Space.exists({ members: userId }).session(session)) {
        throw new ApiError(409, 'already_in_space', 'Ya perteneces a un espacio.')
      }
      if (space.members.length >= 2) throw new ApiError(409, 'space_full', 'Este espacio ya tiene dos miembros.')
      space.members.push(new mongoose.Types.ObjectId(userId))
      await space.save({ session })
    }
    current.status = accept ? 'accepted' : 'rejected'
    await current.save({ session })
    return { spaceId: space._id.toString() }
  })
}
