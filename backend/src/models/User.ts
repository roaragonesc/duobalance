import { Schema, model } from 'mongoose'

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  confirmed: { type: Boolean, required: true, default: false },
  authVersion: { type: Number, required: true, default: 0, select: false },
  confirmationHash: { type: String, select: false },
  confirmationExpiresAt: { type: Date, select: false },
  resetHash: { type: String, select: false },
  resetExpiresAt: { type: Date, select: false },
}, { timestamps: true, strict: 'throw' })

export const User = model('User', userSchema)
