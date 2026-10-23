import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import { after, before, describe, it } from 'node:test'
import type { Server } from 'node:http'
import { createApp } from './app.js'

describe('GET /api/health', () => {
  let server: Server
  let baseUrl: string

  before(async () => {
    server = createApp().listen(0)
    await new Promise(resolve => server.once('listening', resolve))
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })

  after(() => {
    server.close()
  })

  it('répond 200 avec { status: "ok" }', async () => {
    const res = await fetch(`${baseUrl}/api/health`)
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), { status: 'ok' })
  })

  it('répond 404 sur une route inconnue', async () => {
    const res = await fetch(`${baseUrl}/api/inconnue`)
    assert.equal(res.status, 404)
  })
})
