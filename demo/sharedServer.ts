import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

type Document = { revision: number; data: unknown }
type Scenario = { documents: Map<string, Document> }
const prefix = '/__mock'

function reply(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  response.end(JSON.stringify(body))
}

async function readBody(request: IncomingMessage): Promise<unknown> {
  let body = ''
  for await (const chunk of request) {
    body += String(chunk)
    if (Buffer.byteLength(body) > 1_000_000) throw new Error('Mock request is too large')
  }
  return JSON.parse(body)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Installed only for an explicitly enabled, loopback-only mock development server.
export function sharedMockServer(): Plugin {
  const scenarios = new Map<string, Scenario>()
  return {
    name: 'duobalance-shared-test-backend',
    configureServer(server) {
      server.middlewares.use(prefix, async (request, response) => {
        const remote = request.socket.remoteAddress
        const origin = request.headers.origin
        if (
          !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote ?? '') ||
          (origin && (!URL.canParse(origin) || new URL(origin).host !== request.headers.host))
        ) {
          reply(response, 403, { error: 'Local mock access only' })
          return
        }
        try {
          if (request.url === '/scenarios' && request.method === 'POST') {
            const id = randomUUID()
            scenarios.set(id, { documents: new Map() })
            reply(response, 201, { id })
            return
          }
          const id = request.headers.cookie?.match(/(?:^|;\s*)duobalance-scenario=([a-f0-9-]+)/)?.[1]
          const scenario = id ? scenarios.get(id) : undefined
          if (!id || !scenario) {
            reply(response, 404, { error: 'Mock scenario not found' })
            return
          }
          if (request.url === '/scenario' && request.method === 'DELETE') {
            scenarios.delete(id)
            reply(response, 200, { deleted: true })
            return
          }
          const resource = request.url?.match(/^\/(state|movements)$/)?.[1]
          if (!resource) {
            reply(response, 404, { error: 'Mock resource not found' })
            return
          }
          if (request.method === 'GET') {
            reply(response, 200, scenario.documents.get(resource) ?? { revision: 0, data: null })
          } else if (request.method === 'PUT') {
            const body = await readBody(request)
            const current = scenario.documents.get(resource) ?? { revision: 0, data: null }
            if (!isRecord(body) || !Number.isInteger(body.revision) || !isRecord(body.data)) {
              reply(response, 400, { error: 'Invalid mock document' })
            } else if (body.revision !== current.revision) {
              reply(response, 409, { error: 'Concurrent mock change; reload before retrying' })
            } else {
              const next = { revision: current.revision + 1, data: body.data }
              scenario.documents.set(resource, next)
              reply(response, 200, next)
            }
          } else {
            reply(response, 405, { error: 'Method not allowed' })
          }
        } catch (error) {
          server.config.logger.error(`Mock backend: ${String(error)}`)
          reply(response, 400, { error: 'Mock request failed' })
        }
      })
    },
  }
}
