import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { AccountStore } from '../../src/account/store.js'
import { AuthStore } from '../../src/auth/store.js'
import { ButtonStore } from '../../src/buttons/store.js'
import { MEMORY_DATABASE, openDatabase } from '../../src/db/database.js'
import { HttpError } from '../../src/errors.js'
import type { Db } from '../../src/interfaces/database.js'
import { SettingsStore } from '../../src/settings/store.js'

async function rejectsWith (promise: Promise<unknown>, status: number) {
  await assert.rejects(promise, error => error instanceof HttpError && error.status === status)
}

function count (db: Db, table: string, userId: string): number {
  const row = db.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE user_id = ?`).get(userId) as { total: number }
  return row.total
}

describe('AccountStore', () => {
  let db: Db
  let auth: AuthStore
  let account: AccountStore

  beforeEach(() => {
    db = openDatabase(MEMORY_DATABASE)
    auth = new AuthStore(db)
    account = new AccountStore(db)
  })

  afterEach(() => db.close())

  const credentials = { email: 'jean@exemple.fr', password: 'motdepasse' }

  describe('changePassword', () => {
    it('remplace le mot de passe : l\'ancien est refusé, le nouveau accepté', async () => {
      const user = await auth.register(credentials)
      await account.changePassword(user.id, { currentPassword: 'motdepasse', newPassword: 'nouveaumdp' }, undefined)

      await rejectsWith(auth.login(credentials), 401)
      assert.deepEqual(await auth.login({ ...credentials, password: 'nouveaumdp' }), user)
    })

    it('refuse un mot de passe actuel faux (403) sans rien changer ni fermer de session', async () => {
      const user = await auth.register(credentials)
      const token = auth.createSession(user.id)
      await rejectsWith(account.changePassword(user.id, { currentPassword: 'mauvais', newPassword: 'nouveaumdp' }, token), 403)

      assert.deepEqual(await auth.login(credentials), user)
      assert.deepEqual(auth.userForSession(token), user)
    })

    it('refuse des données invalides (400)', async () => {
      const user = await auth.register(credentials)
      await rejectsWith(account.changePassword(user.id, { currentPassword: 'motdepasse', newPassword: 'court' }, undefined), 400)
      await rejectsWith(account.changePassword(user.id, { currentPassword: 'motdepasse', newPassword: 'motdepasse' }, undefined), 400)
      assert.deepEqual(await auth.login(credentials), user)
    })

    it('ferme les autres sessions de la personne et garde la courante', async () => {
      const user = await auth.register(credentials)
      const other = await auth.register({ email: 'marie@exemple.fr', password: 'motdepasse' })
      const current = auth.createSession(user.id)
      const phone = auth.createSession(user.id)
      const otherToken = auth.createSession(other.id)

      await account.changePassword(user.id, { currentPassword: 'motdepasse', newPassword: 'nouveaumdp' }, current)

      assert.deepEqual(auth.userForSession(current), user)
      assert.equal(auth.userForSession(phone), undefined)
      // Un autre compte n'est touché ni dans ses sessions ni dans son mot de passe
      assert.deepEqual(auth.userForSession(otherToken), other)
      assert.deepEqual(await auth.login({ email: 'marie@exemple.fr', password: 'motdepasse' }), other)
    })

    it('ferme toutes les sessions quand aucune n\'est à garder', async () => {
      const user = await auth.register(credentials)
      const token = auth.createSession(user.id)
      await account.changePassword(user.id, { currentPassword: 'motdepasse', newPassword: 'nouveaumdp' }, undefined)
      assert.equal(auth.userForSession(token), undefined)
    })

    it('répond 401 pour une personne qui n\'existe plus', async () => {
      await rejectsWith(account.changePassword('inconnu', { currentPassword: 'motdepasse', newPassword: 'nouveaumdp' }, undefined), 401)
    })
  })

  describe('deleteAccount', () => {
    it('supprime le compte, sa grille, ses réglages et ses sessions, sans toucher aux autres comptes', async () => {
      const user = await auth.register(credentials)
      const other = await auth.register({ email: 'marie@exemple.fr', password: 'motdepasse' })
      const buttons = new ButtonStore(db)
      const settings = new SettingsStore(db)
      for (const id of [user.id, other.id]) {
        await buttons.create(id, { type: 'action', label: 'Exemple', icon: 'mdi-web', url: 'https://exemple.fr', position: 1 })
        await settings.update(id, { volume: 40 })
        auth.createSession(id)
      }

      await account.deleteAccount(user.id, { password: 'motdepasse' })

      for (const table of ['users', 'buttons', 'user_settings', 'sessions']) {
        const column = table === 'users' ? 'id' : 'user_id'
        assert.equal((db.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE ${column} = ?`).get(user.id) as { total: number }).total, 0, table)
      }
      await rejectsWith(auth.login(credentials), 401)

      assert.equal(count(db, 'buttons', other.id), 1)
      assert.equal(count(db, 'user_settings', other.id), 1)
      assert.equal(count(db, 'sessions', other.id), 1)
      assert.deepEqual(await auth.login({ email: 'marie@exemple.fr', password: 'motdepasse' }), other)
    })

    it('refuse un mot de passe faux (403) et garde le compte', async () => {
      const user = await auth.register(credentials)
      await rejectsWith(account.deleteAccount(user.id, { password: 'mauvais' }), 403)
      assert.deepEqual(await auth.login(credentials), user)
    })

    it('refuse un corps sans mot de passe (400)', async () => {
      const user = await auth.register(credentials)
      await rejectsWith(account.deleteAccount(user.id, {}), 400)
      assert.deepEqual(await auth.login(credentials), user)
    })

    it('permet de se réinscrire avec la même adresse, avec une grille vide', async () => {
      const user = await auth.register(credentials)
      await account.deleteAccount(user.id, { password: 'motdepasse' })
      const again = await auth.register(credentials)
      assert.notEqual(again.id, user.id)
      assert.equal(count(db, 'buttons', again.id), 0)
    })
  })
})
