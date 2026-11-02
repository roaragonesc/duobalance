type Resource = {
  name: string
  revision: number
  read: () => unknown
  apply: (data: unknown) => void
}

const enabled = import.meta.env.MODE !== 'pages-demo' && import.meta.env.VITE_MOCK_SHARED === '1'
const resources = new Map<string, Resource>()
const lifecycle = new AbortController()
let queue = Promise.resolve()

window.addEventListener('pagehide', () => lifecycle.abort())

function enqueue(operation: () => Promise<void>): Promise<void> {
  const result = queue.then(() => {
    lifecycle.signal.throwIfAborted()
    return operation()
  })
  // Keep the queue usable after a failed request; the caller still receives the rejection.
  queue = result.catch((error: unknown) => {
    if (lifecycle.signal.aborted) {
      console.debug('Sincronización mock cancelada al abandonar la página.')
    } else {
      console.error('Error de almacenamiento mock compartido.', error)
    }
  })
  return result
}

async function request(resource: Resource, method: 'GET' | 'PUT', data?: unknown) {
  const response = await fetch(`/__mock/${resource.name}`, {
    method,
    signal: lifecycle.signal,
    headers: { 'Content-Type': 'application/json' },
    ...(method === 'PUT' ? { body: JSON.stringify({ revision: resource.revision, data }) } : {}),
  })
  if (!response.ok) throw new Error(`El almacenamiento mock no está disponible (${response.status}).`)
  const result: unknown = await response.json()
  if (
    typeof result !== 'object' || result === null ||
    !('revision' in result) || typeof result.revision !== 'number' || !('data' in result)
  ) throw new Error('Respuesta de almacenamiento mock no válida.')
  resource.revision = result.revision
  return result.data
}

export function registerSharedResource(name: string, read: () => unknown, apply: (data: unknown) => void) {
  resources.set(name, { name, read, apply, revision: 0 })
}

export function syncSharedMock(): Promise<void> {
  if (!enabled) return Promise.resolve()
  return enqueue(async () => {
    for (const resource of resources.values()) {
      const data = await request(resource, 'GET')
      if (data === null) await request(resource, 'PUT', resource.read())
      else resource.apply(data)
    }
  })
}

export function persistSharedMock(name: string): Promise<void> {
  if (!enabled) return Promise.resolve()
  const resource = resources.get(name)
  if (!resource) throw new Error(`Recurso mock desconocido: ${name}`)
  const data = resource.read()
  return enqueue(async () => { await request(resource, 'PUT', data) })
}
