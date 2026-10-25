import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { DEFAULT_SETTINGS } from '../../src/settings/types.js'
import { startTestServer } from '../helpers/server.js'

describe('/api/settings', () => {
  let server: Awaited<ReturnType<typeof startTestServer>>
  let jean: { id: string, cookie: string }
  let marie: { id: string, cookie: string }

  before(async () => {
    server = await startTestServer()
    jean = await server.signUp('jean@exemple.fr')
    marie = await server.signUp('marie@exemple.fr')
  })

  after(() => server.close())

  async function call (cookie: string | undefined, method: string, body?: unknown) {
    const res = await fetch(`${server.baseUrl}/api/settings`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(cookie === undefined ? {} : { Cookie: cookie }),
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
    const text = await res.text()
    return { status: res.status, body: text === '' ? undefined : JSON.parse(text) }
  }

  it('répond 401 sans session ou avec un jeton inconnu', async () => {
    for (const cookie of [undefined, 'sdpc_session=inconnu']) {
      assert.equal((await call(cookie, 'GET')).status, 401)
      assert.equal((await call(cookie, 'PATCH', { volume: 10 })).status, 401)
    }
  })

  it('GET renvoie les valeurs par défaut à un nouveau compte', async () => {
    const res = await call(jean.cookie, 'GET')
    assert.equal(res.status, 200)
    assert.deepEqual(res.body, DEFAULT_SETTINGS)
  })

  it('PATCH modifie un réglage (200), renvoie l\'ensemble, et GET le relit', async () => {
    const patched = await call(jean.cookie, 'PATCH', { volume: 35, theme: 'dark' })
    assert.equal(patched.status, 200)
    assert.deepEqual(patched.body, { ...DEFAULT_SETTINGS, volume: 35, theme: 'dark' })
    assert.deepEqual((await call(jean.cookie, 'GET')).body, patched.body)
  })

  it('PATCH refuse les données invalides (400) avec le détail, et un JSON mal formé', async () => {
    const invalid = await call(jean.cookie, 'PATCH', { volume: 500, couleur: 1 })
    assert.equal(invalid.status, 400)
    assert.equal(invalid.body.details.length, 2)
    assert.equal((await call(jean.cookie, 'PATCH', '{pas du json')).status, 400)
    assert.equal((await call(jean.cookie, 'PATCH')).status, 400)
  })

  it('chaque personne a ses réglages', async () => {
    await call(jean.cookie, 'PATCH', { soundEnabled: false })
    assert.equal((await call(jean.cookie, 'GET')).body.soundEnabled, false)
    assert.equal((await call(marie.cookie, 'GET')).body.soundEnabled, true)
  })
})
