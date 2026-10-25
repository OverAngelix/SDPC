import assert from 'node:assert/strict'
import { beforeEach, afterEach, describe, it } from 'node:test'
import { AuthStore, SESSION_DAYS } from '../../src/auth/store.js'
import type { Db } from '../../src/db/database.js'
import { MEMORY_DATABASE, openDatabase } from '../../src/db/database.js'
import { HttpError } from '../../src/errors.js'

const credentials = { email: 'Jean@Exemple.fr', password: 'motdepasse' }

async function rejectsWith (promise: Promise<unknown>, status: number) {
  await assert.rejects(promise, error => error instanceof HttpError && error.status === status)
}

describe('AuthStore', () => {
  let db: Db
  let clock: { now: number }
  let auth: AuthStore

  beforeEach(() => {
    db = openDatabase(MEMORY_DATABASE)
    clock = { now: Date.parse('2026-01-01T00:00:00Z') }
    auth = new AuthStore(db, () => clock.now)
  })

  afterEach(() => db.close())

  it('crée un compte, adresse en minuscules, sans stocker le mot de passe en clair', async () => {
    const user = await auth.register(credentials)
    assert.equal(user.email, 'jean@exemple.fr')
    assert.match(user.id, /^[0-9a-f-]{36}$/)

    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id) as { password_hash: string }
    assert.ok(!row.password_hash.includes('motdepasse'))
  })

  it('refuse des données invalides (400) et une adresse déjà prise, casse comprise (409)', async () => {
    await rejectsWith(auth.register({ email: 'x', password: 'motdepasse' }), 400)
    await rejectsWith(auth.register({ email: 'a@b.fr', password: 'court' }), 400)
    await auth.register(credentials)
    await rejectsWith(auth.register({ ...credentials, email: 'JEAN@exemple.FR' }), 409)
  })

  it('connecte avec le bon mot de passe', async () => {
    const user = await auth.register(credentials)
    assert.deepEqual(await auth.login({ email: ' JEAN@exemple.fr', password: 'motdepasse' }), user)
  })

  it('refuse (401, même message) un mauvais mot de passe et une adresse inconnue', async () => {
    await auth.register(credentials)
    const messages: string[] = []
    for (const body of [{ ...credentials, password: 'autrechose' }, { email: 'inconnu@exemple.fr', password: 'motdepasse' }]) {
      await assert.rejects(auth.login(body), error => {
        assert.ok(error instanceof HttpError && error.status === 401)
        messages.push(error.message)
        return true
      })
    }
    assert.equal(messages[0], messages[1])
  })

  it('refuse une connexion sans données valides (400)', async () => {
    await rejectsWith(auth.login({}), 400)
  })

  describe('sessions', () => {
    it('retrouve la personne à partir du jeton, sans stocker le jeton lui-même', async () => {
      const user = await auth.register(credentials)
      const token = auth.createSession(user.id)

      assert.deepEqual(auth.userForSession(token), user)
      const stored = db.prepare('SELECT token_hash FROM sessions').all() as { token_hash: string }[]
      assert.equal(stored.length, 1)
      assert.notEqual(stored[0].token_hash, token)
    })

    it('ne reconnaît ni un jeton inconnu ni un jeton supprimé', async () => {
      const user = await auth.register(credentials)
      const token = auth.createSession(user.id)
      assert.equal(auth.userForSession('inconnu'), undefined)

      auth.deleteSession(token)
      assert.equal(auth.userForSession(token), undefined)
    })

    it('donne un jeton différent à chaque session', async () => {
      const user = await auth.register(credentials)
      assert.notEqual(auth.createSession(user.id), auth.createSession(user.id))
    })

    it('dure 90 jours, puis expire et purge les sessions expirées', async () => {
      const user = await auth.register(credentials)
      const token = auth.createSession(user.id)

      clock.now += (SESSION_DAYS * 24 * 60 * 60 * 1000) - 1000
      assert.deepEqual(auth.userForSession(token), user)
      clock.now += 1000
      assert.equal(auth.userForSession(token), undefined)

      auth.createSession(user.id)
      assert.equal((db.prepare('SELECT count(*) AS n FROM sessions').get() as { n: number }).n, 1)
    })

    it('disparaît avec le compte', async () => {
      const user = await auth.register(credentials)
      const token = auth.createSession(user.id)
      db.prepare('DELETE FROM users WHERE id = ?').run(user.id)
      assert.equal(auth.userForSession(token), undefined)
    })
  })
})
