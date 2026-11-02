// Raised by the services whose tables and policies are not migrated yet.
// Reads return no data and writes fail with this error: nothing is simulated.
export class BackendUnavailableError extends Error {
  constructor(feature: string) {
    super(`${feature} backend is not connected yet`)
    this.name = 'BackendUnavailableError'
  }
}