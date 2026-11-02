// Demo mode only (npm run dev:demo). Never imported by the production build.
import { useSyncExternalStore } from 'react'
import type { SplitMethod } from '../src/features/spaces/types/space'

export const DEMO_PASSWORD = 'Demo1234!'

export type DemoUserKey = 'nuevo' | 'solo' | 'rocio' | 'pablo'

export type DemoSpace = {
  id: string
  name: string
  splitMethod: SplitMethod
  owner: DemoUserKey
  members: DemoUserKey[]
}

type DemoState = {
  user: DemoUserKey | null
  names: Record<DemoUserKey, string>
  spaces: DemoSpace[]
}

export const demoUsers: { key: DemoUserKey; email: string; description: string }[] = [
  { key: 'nuevo', email: 'nuevo@duobalance.test', description: 'Sin espacio (onboarding)' },
  { key: 'solo', email: 'solo@duobalance.test', description: 'Espacio sin pareja' },
  { key: 'rocio', email: 'rocio@duobalance.test', description: 'Pareja completa (creadora)' },
  { key: 'pablo', email: 'pablo@duobalance.test', description: 'Pareja completa (invitado)' },
]

function initialState(): DemoState {
  return {
    user: null,
    names: { nuevo: 'Nora Vidal', solo: 'Sergio López', rocio: 'Rocío Aragonés', pablo: 'Pablo Martín' },
    spaces: [
      { id: 'space-solo', name: 'Piso Centro', splitMethod: 'equal', owner: 'solo', members: ['solo'] },
      { id: 'space-casa', name: 'Casa', splitMethod: 'equal', owner: 'rocio', members: ['rocio', 'pablo'] },
    ],
  }
}

const STORAGE_KEY = 'duobalance-demo'
const listeners = new Set<() => void>()

function load(): DemoState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored) as DemoState
  } catch {
    // Corrupted demo data: start again.
  }
  return initialState()
}

let state = load()

export function getDemoState(): DemoState {
  return state
}

export function updateDemoState(change: (current: DemoState) => DemoState) {
  state = change(state)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  listeners.forEach((listener) => listener())
}

/** Restores the initial users and spaces, keeping the current session. */
export function resetDemoState() {
  const { user } = state
  updateDemoState(() => ({ ...initialState(), user }))
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useDemoState(): DemoState {
  return useSyncExternalStore(subscribe, getDemoState)
}

export function demoUserId(key: DemoUserKey) {
  return `demo-${key}`
}

export function demoUserFromId(id: string): DemoUserKey {
  const user = demoUsers.find((candidate) => demoUserId(candidate.key) === id)
  if (!user) throw new Error('Unknown demo user')
  return user.key
}

export function getDemoSpace(key: DemoUserKey): DemoSpace | null {
  return state.spaces.find((space) => space.members.includes(key)) ?? null
}

/** Only the full couple has sample movements; other users see empty states. */
export function hasSampleData(spaceId: string) {
  return state.spaces.find((space) => space.id === spaceId)?.members.length === 2
}

/** Who "me" is in the sample data, so both members see consistent movements. */
export function isSpaceOwner() {
  const { user } = state
  return user ? state.spaces.some((space) => space.owner === user) : true
}

export function demoDelay() {
  return new Promise((resolve) => setTimeout(resolve, 250))
}
