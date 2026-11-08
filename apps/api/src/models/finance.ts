import { Schema, model } from 'mongoose'

const ref = (target: string) => ({ type: Schema.Types.ObjectId, ref: target, required: true })
const cents = { type: Number, required: true, min: 1, max: Number.MAX_SAFE_INTEGER, validate: Number.isSafeInteger }
const date = { type: String, required: true }
const options = { timestamps: true, strict: 'throw' as const }
const seedKey = { type: String, unique: true, sparse: true }

const space = new Schema({
  name: { type: String, required: true, maxlength: 80 },
  createdBy: ref('User'),
  members: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  splitMethod: { type: String, enum: ['equal', 'proportional'], required: true },
  revision: { type: Number, default: 0 },
  seedKey,
}, options)
space.index({ members: 1 }, { unique: true })
export const Space = model('Space', space)

const invitation = new Schema({
  spaceId: ref('Space'), invitedBy: ref('User'),
  invitedEmail: { type: String, required: true },
  tokenHash: { type: String, required: true, unique: true, select: false },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending', required: true },
  expiresAt: { type: Date, required: true }, seedKey,
}, options)
invitation.index({ invitedEmail: 1, status: 1 })
export const Invitation = model('Invitation', invitation)

const category = new Schema({
  name: { type: String, required: true, maxlength: 80 },
  icon: { type: String, required: true },
  color: { type: String, required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  key: { type: String, unique: true, sparse: true },
  seedKey,
}, options)
category.index({ ownerId: 1 })
export const Category = model('Category', category)

const expense = new Schema({
  spaceId: ref('Space'), createdBy: ref('User'), paidBy: ref('User'),
  description: { type: String, required: true, maxlength: 160 },
  amountCents: cents, categoryId: ref('Category'),
  kind: { type: String, enum: ['shared', 'individual'], required: true },
  date,
  ownerBasisPoints: { type: Number, required: true, min: 0, max: 10000, validate: Number.isInteger },
  seedKey,
}, options)
expense.index({ spaceId: 1, date: -1, createdAt: -1, _id: -1 })
export const Expense = model('Expense', expense)

const income = new Schema({
  spaceId: ref('Space'), createdBy: ref('User'),
  description: { type: String, required: true, maxlength: 160 },
  amountCents: cents, date, seedKey,
}, options)
income.index({ spaceId: 1, date: -1 })
export const Income = model('Income', income)

const settlement = new Schema({
  spaceId: ref('Space'), fromUserId: ref('User'), toUserId: ref('User'), createdBy: ref('User'),
  amountCents: cents, date, note: { type: String, default: null, maxlength: 500 }, seedKey,
}, options)
settlement.index({ spaceId: 1, date: -1 })
export const Settlement = model('Settlement', settlement)

export const financeModels = [Space, Invitation, Category, Expense, Income, Settlement]
