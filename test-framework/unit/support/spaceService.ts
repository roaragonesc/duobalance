import { record, services } from './serviceState'

export async function getCurrentSpaceId(...args: unknown[]) {
  record('getCurrentSpaceId', ...args)
  return services.options.spaceId ?? null
}

export async function createSpace(...args: unknown[]) {
  record('createSpace', ...args)
  return 'space-1'
}
