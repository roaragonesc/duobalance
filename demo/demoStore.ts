// Development-only mock state. Vite excludes this module from production builds.
import { useSyncExternalStore } from 'react'
import type { SplitMethod } from '../src/features/spaces/types/space'
import { persistSharedMock, registerSharedResource, syncSharedMock } from './sharedClient'

export const DEMO_PASSWORD = 'Demo1234!'
const STORAGE_KEY = 'duobalance-mock-v1'

export type DemoUserKey = string

export type DemoAccount = {
  key: DemoUserKey
  email: string
  name: string
  description: string
  password: string
  confirmed: boolean
  confirmationToken: string | null
  confirmationNext: string | null
  passwordResetToken: string | null
  createdAt: string
}

export type DemoSpace = {
  id: string
  name: string
  splitMethod: SplitMethod
  owner: DemoUserKey
  members: DemoUserKey[]
}

export type DemoInvitation = {
  token: string
  email: string
  spaceId: string
  createdAt: string
  expiresAt: string
  used: boolean
}

export type DemoState = {
  user: DemoUserKey | null
  users: Record<DemoUserKey, DemoAccount>
  spaces: DemoSpace[]
  invitations: DemoInvitation[]
}

const listeners = new Set<() => void>()
let generatedId = 0

function account(
  key: string,
  email: string,
  name: string,
  description: string,
): DemoAccount {
  return {
    key,
    email,
    name,
    description,
    password: DEMO_PASSWORD,
    confirmed: true,
    confirmationToken: null,
    confirmationNext: null,
    passwordResetToken: null,
    createdAt: new Date().toISOString(),
  }
}

function initialState(): DemoState {
  const users = [
    account('nuevo', 'nuevo@duobalance.test', 'Nora Vidal', 'Sin espacio'),
    account('solo', 'solo@duobalance.test', 'Sergio López', 'Espacio sin pareja'),
    account('rocio', 'rocio@duobalance.test', 'Rocío Aragonés', 'Pareja completa · creadora'),
    account('pablo', 'pablo@duobalance.test', 'Pablo Martín', 'Pareja completa · invitado'),
    account('ines', 'ines@duobalance.test', 'Inés Demo', 'Disponible para invitaciones'),
    account('mateo', 'mateo@duobalance.test', 'Mateo Demo', 'Disponible para invitaciones'),
  ]

  return {
    user: null,
    users: Object.fromEntries(users.map((user) => [user.key, user])),
    spaces: [
      { id: 'space-solo', name: 'Piso Centro', splitMethod: 'equal', owner: 'solo', members: ['solo'] },
      { id: 'space-casa', name: 'Casa', splitMethod: 'equal', owner: 'rocio', members: ['rocio', 'pablo'] },
    ],
    invitations: [],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isDemoAccount(value: unknown): value is DemoAccount {
  return (
    isRecord(value) &&
    typeof value.key === 'string' &&
    typeof value.email === 'string' &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    typeof value.password === 'string' &&
    typeof value.confirmed === 'boolean' &&
    (typeof value.confirmationToken === 'string' || value.confirmationToken === null) &&
    (typeof value.confirmationNext === 'string' || value.confirmationNext === null) &&
    (typeof value.passwordResetToken === 'string' || value.passwordResetToken === null) &&
    typeof value.createdAt === 'string'
  )
}

function isDemoState(value: unknown): value is DemoState {
  if (!isRecord(value) || !(value.user === null || typeof value.user === 'string')) return false
  if (!isRecord(value.users) || !Object.values(value.users).every(isDemoAccount)) return false
  if (!Array.isArray(value.spaces) || !Array.isArray(value.invitations)) return false
  const userKeys = new Set(Object.keys(value.users))
  if (value.user !== null && !userKeys.has(value.user)) return false
  const validSpaces = value.spaces.every(
    (space) =>
      isRecord(space) &&
      typeof space.id === 'string' &&
      typeof space.name === 'string' &&
      (space.splitMethod === 'equal' || space.splitMethod === 'proportional') &&
      typeof space.owner === 'string' &&
      userKeys.has(space.owner) &&
      Array.isArray(space.members) &&
      space.members.length <= 2 &&
      space.members.every((member) => typeof member === 'string' && userKeys.has(member)),
  )
  const validInvitations = value.invitations.every(
    (invitation) =>
      isRecord(invitation) &&
      typeof invitation.token === 'string' &&
      typeof invitation.email === 'string' &&
      typeof invitation.spaceId === 'string' &&
      typeof invitation.createdAt === 'string' &&
      typeof invitation.expiresAt === 'string' &&
      typeof invitation.used === 'boolean',
  )
  return validSpaces && validInvitations
}

function load(): DemoState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === null) return initialState()
    const parsed: unknown = JSON.parse(stored)
    if (isDemoState(parsed)) return parsed
    console.warn('Los datos mock guardados no son válidos; se han restablecido.')
  } catch (error) {
    console.warn('No se pudieron leer los datos mock; se han restablecido.', error)
  }
  return initialState()
}

let state = load()

registerSharedResource('state', () => ({ ...state, user: null }), (data) => {
  if (!isDemoState(data)) throw new Error('Datos compartidos mock no válidos.')
  const next = { ...data, user: state.user }
  if (JSON.stringify(next) !== JSON.stringify(state)) {
    state = next
    notify()
  }
})

function notify() {
  listeners.forEach((listener) => listener())
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY || event.newValue === null) return
    try {
      const parsed: unknown = JSON.parse(event.newValue)
      if (!isDemoState(parsed)) {
        console.warn('Se ha ignorado un cambio de datos mock no válido.')
        return
      }
      state = parsed
      notify()
    } catch (error) {
      console.warn('No se pudo leer un cambio de datos mock.', error)
    }
  })
}

export function getDemoState(): DemoState {
  return state
}

export async function updateDemoState(change: (current: DemoState) => DemoState) {
  const previous = JSON.stringify({ ...state, user: null })
  state = change(state)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  if (previous !== JSON.stringify({ ...state, user: null })) {
    await persistSharedMock('state')
  }
  notify()
}

export async function resetDemoState() {
  state = initialState()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  await persistSharedMock('state')
  notify()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function subscribeDemoState(listener: () => void) {
  return subscribe(listener)
}

export function useDemoState(): DemoState {
  return useSyncExternalStore(subscribe, getDemoState)
}

export function createDemoToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

export function createDemoUserKey(): DemoUserKey {
  generatedId += 1
  return `registro-${Date.now()}-${generatedId}`
}

export function getDemoUser(key: DemoUserKey): DemoAccount | null {
  return state.users[key] ?? null
}

export function findDemoUserByEmail(email: string): DemoAccount | null {
  const normalized = email.trim().toLowerCase()
  return Object.values(state.users).find((user) => user.email === normalized) ?? null
}

export function addDemoUser(user: DemoAccount) {
  return updateDemoState((current) => ({
    ...current,
    users: { ...current.users, [user.key]: user },
  }))
}

export function setDemoUser(key: DemoUserKey | null) {
  if (key !== null && !getDemoUser(key)) throw new Error('Usuario mock desconocido.')
  updateDemoState((current) => ({ ...current, user: key }))
}

export function demoUserId(key: DemoUserKey): string {
  return `mock-${key}`
}

export function demoUserFromId(id: string): DemoUserKey {
  const key = id.startsWith('mock-') ? id.slice('mock-'.length) : ''
  if (!getDemoUser(key)) throw new Error('Usuario mock desconocido.')
  return key
}

export function getDemoSpace(key: DemoUserKey): DemoSpace | null {
  return state.spaces.find((space) => space.members.includes(key)) ?? null
}

/** Every existing space can contain movements, not just the seeded demo couple. */
export function hasSampleData(spaceId: string): boolean {
  return state.spaces.some((space) => space.id === spaceId && space.members.includes(state.user ?? ''))
}

export function isSpaceOwner(): boolean {
  const { user } = state
  return user ? state.spaces.some((space) => space.owner === user) : true
}

export async function demoDelay(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 25))
  await syncSharedMock()
}
