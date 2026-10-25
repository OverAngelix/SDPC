import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { LoginLimiter } from '../../src/auth/loginLimiter.js'
import { startTestServer } from '../helpers/server.js'

const credentials = { email: 'jean@exemple.fr', password: 'motdepasse' }

describe('/api/auth', () => {
  let server: Awaited<ReturnType<typeof startTestServer>>

  before(async () => {
    server = await startTestServer({ limiter: new LoginLimiter(3) })
  })

  after(() => server.close())

  async function call (method: string, path: string, body?: unknown, cookie?: string) {
    const res = await fetch(`${server.baseUrl}/api/auth${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(cookie === undefined ? {} : { Cookie: cookie }),
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
    const text = await res.text()
    // Seule la paire nom=valeur du cookie est renvoyée au serveur
    const setCookie = res.headers.get('set-cookie')
    return {
      status: res.status,
      body: text === '' ? undefined : JSON.parse(text),
      setCookie,
      cookie: setCookie?.split(';')[0],
      retryAfter: res.headers.get('retry-after'),
    }
  }

  it('POST /register crée le compte (201) et ouvre une session par cookie sécurisé', async () => {
    const res = await call('POST', '/register', credentials)
    assert.equal(res.status, 201)
    assert.equal(res.body.email, credentials.email)
    assert.equal(res.body.password, undefined)
    assert.match(res.setCookie ?? '', /^sdpc_session=[\w-]{43};/)
    assert.match(res.setCookie ?? '', /HttpOnly/)
    assert.match(res.setCookie ?? '', /SameSite=Lax/)
    assert.doesNotMatch(res.setCookie ?? '', /Secure/)

    const me = await call('GET', '/me', undefined, res.cookie)
    assert.equal(me.status, 200)
    assert.deepEqual(me.body, res.body)
  })

  it('POST /register refuse les données invalides (400) et une adresse déjà prise (409)', async () => {
    assert.equal((await call('POST', '/register', { email: 'nope', password: 'x' })).status, 400)
    const res = await call('POST', '/register', credentials)
    assert.equal(res.status, 409)
    assert.equal(res.setCookie, null)
  })

  it('POST /register répond 400 sur un JSON mal formé', async () => {
    assert.equal((await call('POST', '/register', '{pas du json')).status, 400)
  })

  it('GET /me répond 401 sans session, avec un jeton inconnu ou un cookie illisible', async () => {
    assert.equal((await call('GET', '/me')).status, 401)
    assert.equal((await call('GET', '/me', undefined, 'sdpc_session=inconnu')).status, 401)
    assert.equal((await call('GET', '/me', undefined, 'sdpc_session=%E0%A4%A')).status, 401)
  })

  it('POST /login ouvre une session, adresse insensible à la casse', async () => {
    const res = await call('POST', '/login', { email: 'JEAN@exemple.fr', password: credentials.password })
    assert.equal(res.status, 200)
    assert.equal(res.body.email, credentials.email)
    assert.equal((await call('GET', '/me', undefined, res.cookie)).status, 200)
  })

  it('POST /logout supprime la session côté serveur et efface le cookie', async () => {
    const { cookie } = await call('POST', '/login', credentials)
    const out = await call('POST', '/logout', undefined, cookie)
    assert.equal(out.status, 204)
    assert.match(out.setCookie ?? '', /^sdpc_session=;/)
    assert.equal((await call('GET', '/me', undefined, cookie)).status, 401)
  })

  it('POST /logout répond 204 même sans session', async () => {
    assert.equal((await call('POST', '/logout')).status, 204)
  })

  it('POST /login refuse (401) sans révéler si l\'adresse existe, puis bloque après 3 échecs (429)', async () => {
    const wrong = await call('POST', '/login', { email: 'jean@exemple.fr', password: 'mauvais' })
    const unknown = await call('POST', '/login', { email: 'inconnu@exemple.fr', password: 'mauvais' })
    assert.equal(wrong.status, 401)
    assert.deepEqual(wrong.body, unknown.body)

    await call('POST', '/login', { email: 'jean@exemple.fr', password: 'mauvais' })
    await call('POST', '/login', { email: 'jean@exemple.fr', password: 'mauvais' })
    const blocked = await call('POST', '/login', credentials)
    assert.equal(blocked.status, 429)
    assert.ok(Number(blocked.retryAfter) > 0)
    assert.equal(blocked.setCookie, null)

    // Une autre adresse n'est pas touchée
    assert.equal((await call('POST', '/login', { email: 'inconnu@exemple.fr', password: 'mauvais' })).status, 401)
  })
})
