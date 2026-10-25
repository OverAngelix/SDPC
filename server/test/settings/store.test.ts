import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import type { Db } from '../../src/db/database.js'
import { MEMORY_DATABASE, openDatabase } from '../../src/db/database.js'
import { HttpError } from '../../src/errors.js'
import { SettingsStore } from '../../src/settings/store.js'
import { DEFAULT_SETTINGS } from '../../src/settings/types.js'
import { createUser } from '../helpers/users.js'

async function rejectsWith (promise: Promise<unknown>, status: number) {
  await assert.rejects(promise, error => error instanceof HttpError && error.status === status)
}

describe('SettingsStore', () => {
  let db: Db
  let store: SettingsStore
  let userId: string

  beforeEach(() => {
    db = openDatabase(MEMORY_DATABASE)
    store = new SettingsStore(db)
    userId = createUser(db)
  })

  afterEach(() => db.close())

  it('renvoie les valeurs par défaut sans rien enregistrer', () => {
    assert.deepEqual(store.get(userId), DEFAULT_SETTINGS)
    assert.equal((db.prepare('SELECT count(*) AS n FROM user_settings').get() as { n: number }).n, 0)
  })

  it('les valeurs par défaut du serveur sont celles de la table', async () => {
    await store.update(userId, {})
    assert.deepEqual(store.get(userId), DEFAULT_SETTINGS)
  })

  it('enregistre un réglage sans toucher aux autres, et renvoie l\'ensemble', async () => {
    const updated = await store.update(userId, { volume: 40 })
    assert.deepEqual(updated, { ...DEFAULT_SETTINGS, volume: 40 })

    assert.deepEqual(await store.update(userId, { theme: 'dark', soundEnabled: false }), {
      ...DEFAULT_SETTINGS,
      volume: 40,
      theme: 'dark',
      soundEnabled: false,
    })
    assert.equal((db.prepare('SELECT count(*) AS n FROM user_settings').get() as { n: number }).n, 1)
  })

  it('enregistre les quatre réglages à la fois, booléens compris', async () => {
    const all = { soundEnabled: false, volume: 0, effectsEnabled: false, theme: 'light' as const }
    assert.deepEqual(await store.update(userId, all), all)
    assert.deepEqual(await store.update(userId, { soundEnabled: true, effectsEnabled: true }), { ...all, soundEnabled: true, effectsEnabled: true })
  })

  it('conserve les réglages dans la base', async () => {
    await store.update(userId, { volume: 12, theme: 'light' })
    assert.deepEqual(new SettingsStore(db).get(userId), { ...DEFAULT_SETTINGS, volume: 12, theme: 'light' })
  })

  it('refuse des données invalides (400) sans rien modifier', async () => {
    await store.update(userId, { volume: 40 })
    await rejectsWith(store.update(userId, { volume: 101 }), 400)
    await rejectsWith(store.update(userId, { theme: 'rouge' }), 400)
    await rejectsWith(store.update(userId, { inconnu: true }), 400)
    assert.equal(store.get(userId).volume, 40)
  })

  it('garde les réglages de chaque personne séparés', async () => {
    const other = createUser(db, 'marie@exemple.fr')
    await store.update(userId, { volume: 10, theme: 'dark' })
    await store.update(other, { volume: 90 })

    assert.deepEqual(store.get(userId), { ...DEFAULT_SETTINGS, volume: 10, theme: 'dark' })
    assert.deepEqual(store.get(other), { ...DEFAULT_SETTINGS, volume: 90 })
  })

  it('disparaît avec le compte', async () => {
    await store.update(userId, { volume: 10 })
    db.prepare('DELETE FROM users WHERE id = ?').run(userId)
    assert.equal((db.prepare('SELECT count(*) AS n FROM user_settings').get() as { n: number }).n, 0)
  })

  it('la base refuse elle-même une valeur hors plage', async () => {
    await store.update(userId, {})
    assert.throws(() => db.prepare('UPDATE user_settings SET volume = 101 WHERE user_id = ?').run(userId), /CHECK/)
    assert.throws(() => db.prepare("UPDATE user_settings SET theme = 'rouge' WHERE user_id = ?").run(userId), /CHECK/)
  })
})
