import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { LoginLimiter } from '../../src/auth/loginLimiter.js'
import { startTestServer } from '../helpers/server.js'

describe('/api/account', () => {
  let server: Awaited<ReturnType<typeof startTestServer>>

  before(async () => {
    server = await startTestServer({ limiter: new LoginLimiter(3) })
  })

  after(() => server.close())

  async function call (method: string, path: string, body?: unknown, cookie?: string) {
    const res = await fetch(`${server.baseUrl}/api/account${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(cookie === undefined ? {} : { Cookie: cookie }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await res.text()
    return {
      status: res.status,
      body: text === '' ? undefined : JSON.parse(text),
      setCookie: res.headers.get('set-cookie'),
      retryAfter: res.headers.get('retry-after'),
    }
  }

  async function login (email: string, password: string): Promise<number> {
    const res = await fetch(`${server.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    return res.status
  }

  async function me (cookie: string): Promise<number> {
    return (await fetch(`${server.baseUrl}/api/auth/me`, { headers: { Cookie: cookie } })).status
  }

  it('répond 401 sans session', async () => {
    assert.equal((await call('PUT', '/password', { currentPassword: 'a', newPassword: 'b' })).status, 401)
    assert.equal((await call('DELETE', '/', { password: 'motdepasse' })).status, 401)
  })

  describe('PUT /password', () => {
    it('change le mot de passe (204), garde la session courante et ferme les autres', async () => {
      const { cookie } = await server.signUp('changement@exemple.fr')
      const phone = `sdpc_session=${server.auth.createSession((await server.auth.login({ email: 'changement@exemple.fr', password: 'motdepasse' })).id)}`

      const res = await call('PUT', '/password', { currentPassword: 'motdepasse', newPassword: 'nouveaumdp' }, cookie)
      assert.equal(res.status, 204)
      assert.equal(res.setCookie, null)

      assert.equal(await me(cookie), 200)
      assert.equal(await me(phone), 401)
      assert.equal(await login('changement@exemple.fr', 'motdepasse'), 401)
      assert.equal(await login('changement@exemple.fr', 'nouveaumdp'), 200)
    })

    it('répond 403 (jamais 401) quand le mot de passe actuel est faux, sans déconnecter', async () => {
      const { cookie } = await server.signUp('faux@exemple.fr')
      const res = await call('PUT', '/password', { currentPassword: 'mauvais', newPassword: 'nouveaumdp' }, cookie)
      assert.equal(res.status, 403)
      assert.equal(res.body.error, 'Mot de passe actuel incorrect')
      assert.equal(await me(cookie), 200)
      assert.equal(await login('faux@exemple.fr', 'motdepasse'), 200)
    })

    it('répond 400 pour un nouveau mot de passe invalide ou identique à l\'actuel', async () => {
      const { cookie } = await server.signUp('invalide@exemple.fr')
      const short = await call('PUT', '/password', { currentPassword: 'motdepasse', newPassword: 'court' }, cookie)
      assert.equal(short.status, 400)
      assert.deepEqual(short.body.details, ['newPassword : 8 caractères au moins'])
      assert.equal((await call('PUT', '/password', { currentPassword: 'motdepasse', newPassword: 'motdepasse' }, cookie)).status, 400)
      assert.equal((await call('PUT', '/password', undefined, cookie)).status, 400)
    })

    it('ne touche pas au mot de passe d\'un autre compte', async () => {
      const { cookie } = await server.signUp('premier@exemple.fr')
      await server.signUp('second@exemple.fr')
      await call('PUT', '/password', { currentPassword: 'motdepasse', newPassword: 'nouveaumdp' }, cookie)
      assert.equal(await login('second@exemple.fr', 'motdepasse'), 200)
    })

    it('bloque après 3 mots de passe faux (429), même avec le bon, sans bloquer les autres comptes', async () => {
      const { cookie } = await server.signUp('essais@exemple.fr')
      const other = await server.signUp('autre@exemple.fr')
      const wrong = { currentPassword: 'mauvais', newPassword: 'nouveaumdp' }
      for (let i = 0; i < 3; i++) assert.equal((await call('PUT', '/password', wrong, cookie)).status, 403)

      const blocked = await call('PUT', '/password', { currentPassword: 'motdepasse', newPassword: 'nouveaumdp' }, cookie)
      assert.equal(blocked.status, 429)
      assert.ok(Number(blocked.retryAfter) > 0)
      assert.equal(await login('essais@exemple.fr', 'motdepasse'), 200)

      assert.equal((await call('PUT', '/password', { currentPassword: 'motdepasse', newPassword: 'nouveaumdp' }, other.cookie)).status, 204)
    })

    it('un succès remet les essais à zéro', async () => {
      const { cookie } = await server.signUp('zero@exemple.fr')
      const wrong = { currentPassword: 'mauvais', newPassword: 'nouveaumdp' }
      await call('PUT', '/password', wrong, cookie)
      await call('PUT', '/password', wrong, cookie)
      assert.equal((await call('PUT', '/password', { currentPassword: 'motdepasse', newPassword: 'nouveaumdp' }, cookie)).status, 204)
      await call('PUT', '/password', wrong, cookie)
      await call('PUT', '/password', wrong, cookie)
      assert.equal((await call('PUT', '/password', { currentPassword: 'nouveaumdp', newPassword: 'encoreunautre' }, cookie)).status, 204)
    })
  })

  describe('DELETE /', () => {
    it('supprime le compte (204), efface le cookie, et la personne ne peut plus se connecter', async () => {
      const { id, cookie } = await server.signUp('partir@exemple.fr')
      const res = await call('DELETE', '/', { password: 'motdepasse' }, cookie)
      assert.equal(res.status, 204)
      assert.match(res.setCookie ?? '', /^sdpc_session=;/)

      assert.equal(await me(cookie), 401)
      assert.equal(await login('partir@exemple.fr', 'motdepasse'), 401)
      assert.equal(server.db.prepare('SELECT COUNT(*) AS total FROM users WHERE id = ?').pluck().get(id), 0)
    })

    it('emporte la grille et les réglages, mais pas ceux d\'un autre compte', async () => {
      const gone = await server.signUp('grille@exemple.fr')
      const kept = await server.signUp('reste@exemple.fr')
      for (const { id } of [gone, kept]) {
        await server.store.create(id, { type: 'action', label: 'Exemple', icon: 'mdi-web', url: 'https://exemple.fr', position: 1 })
        await server.settings.update(id, { volume: 10 })
      }

      await call('DELETE', '/', { password: 'motdepasse' }, gone.cookie)

      const total = (table: string, id: string) => server.db.prepare(`SELECT COUNT(*) FROM ${table} WHERE user_id = ?`).pluck().get(id)
      assert.equal(total('buttons', gone.id), 0)
      assert.equal(total('user_settings', gone.id), 0)
      assert.equal(total('buttons', kept.id), 1)
      assert.equal(total('user_settings', kept.id), 1)
      assert.equal(await me(kept.cookie), 200)
    })

    it('répond 403 pour un mot de passe faux et garde le compte', async () => {
      const { cookie } = await server.signUp('garde@exemple.fr')
      const res = await call('DELETE', '/', { password: 'mauvais' }, cookie)
      assert.equal(res.status, 403)
      assert.equal(res.setCookie, null)
      assert.equal(await me(cookie), 200)
    })

    it('répond 400 sans mot de passe', async () => {
      const { cookie } = await server.signUp('sansmdp@exemple.fr')
      assert.equal((await call('DELETE', '/', {}, cookie)).status, 400)
      assert.equal((await call('DELETE', '/', undefined, cookie)).status, 400)
      assert.equal(await me(cookie), 200)
    })

    it('bloque après 3 mots de passe faux (429)', async () => {
      const { cookie } = await server.signUp('bloque@exemple.fr')
      for (let i = 0; i < 3; i++) assert.equal((await call('DELETE', '/', { password: 'mauvais' }, cookie)).status, 403)
      assert.equal((await call('DELETE', '/', { password: 'motdepasse' }, cookie)).status, 429)
      assert.equal(await me(cookie), 200)
    })
  })
})
