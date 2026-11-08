import { Schema, model } from 'mongoose'

const sessionSchema = new Schema({
  tokenHash: { type: String, required: true, unique: true },
  csrfHash: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  authVersion: { type: Number, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true, strict: 'throw' })

export const Session = model('Session', sessionSchema)
