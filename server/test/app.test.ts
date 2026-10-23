import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { startTestServer } from './helpers/server.js'

describe('GET /api/health', () => {
  let server: Awaited<ReturnType<typeof startTestServer>>

  before(async () => {
    server = await startTestServer()
  })

  after(() => server.close())

  it('répond 200 avec { status: "ok" }', async () => {
    const res = await fetch(`${server.baseUrl}/api/health`)
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), { status: 'ok' })
  })

  it('répond 404 en JSON sur une route inconnue', async () => {
    const res = await fetch(`${server.baseUrl}/api/inconnue`)
    assert.equal(res.status, 404)
    assert.deepEqual(await res.json(), { error: 'Route introuvable' })
  })
})
