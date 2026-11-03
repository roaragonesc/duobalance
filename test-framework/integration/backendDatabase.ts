import { createRequire } from 'node:module'

// Seed/models use the backend's Mongoose connection, not a second package instance.
const backendRequire = createRequire(new URL('../../backend/package.json', import.meta.url))
export const database: typeof import('mongoose').default = backendRequire('mongoose')
