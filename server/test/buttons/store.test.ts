import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { HttpError } from '../../src/errors.js'
import { ButtonStore } from '../../src/buttons/store.js'
import type { Db } from '../../src/db/database.js'
import { openDatabase } from '../../src/db/database.js'

const action = { position: 0, label: 'YouTube', icon: 'mdi-youtube', type: 'action', url: 'https://www.youtube.com' }
const folder = { position: 1, label: 'Musique', icon: 'mdi-folder', type: 'folder' }

async function rejectsWith (promise: Promise<unknown>, status: number) {
  await assert.rejects(promise, error => error instanceof HttpError && error.status === status)
}

describe('ButtonStore', () => {
  let dir: string
  let file: string
  let opened: Db[]
  let db: Db

  // Chaque ouverture est un nouvel accès au même fichier, comme après un redémarrage du serveur
  function reopen () {
    const connection = openDatabase(file)
    opened.push(connection)
    return new ButtonStore(connection)
  }

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'sdpc-store-'))
    file = join(dir, 'data', 'sdpc.db')
    opened = []
    db = openDatabase(file)
    opened.push(db)
  })

  afterEach(async () => {
    for (const connection of opened) connection.close()
    await rm(dir, { recursive: true, force: true })
  })

  it('crée un bouton, le retrouve et le conserve après réouverture', async () => {
    const store = new ButtonStore(db)
    const created = await store.create(action)
    assert.match(created.id, /^[0-9a-f-]{36}$/)
    assert.deepEqual(store.get(created.id), created)

    const reopened = reopen()
    assert.deepEqual(reopened.list(), [created])
  })

  it('liste la racine ou le contenu d\'un dossier', async () => {
    const store = new ButtonStore(db)
    const parent = await store.create(folder)
    const child = await store.create({ ...action, position: 1, parentId: parent.id })
    const root = await store.create({ ...action, position: 2 })

    assert.deepEqual(store.list(null).map(button => button.id), [parent.id, root.id])
    assert.deepEqual(store.list(parent.id), [child])
    assert.equal(store.list().length, 3)
  })

  it('autorise le même emplacement dans deux dossiers différents', async () => {
    const store = new ButtonStore(db)
    const parent = await store.create(folder)
    await store.create(action)
    await store.create({ ...action, position: 1, parentId: parent.id })
    assert.equal(store.list().length, 3)
  })

  it('réserve l\'emplacement 0 d\'un dossier au retour (400), pas celui de la racine', async () => {
    const store = new ButtonStore(db)
    const parent = await store.create(folder)
    await rejectsWith(store.create({ ...action, position: 0, parentId: parent.id }), 400)

    const child = await store.create({ ...action, position: 1, parentId: parent.id })
    await rejectsWith(store.update(child.id, { position: 0 }), 400)

    assert.equal((await store.create({ ...action, position: 0 })).position, 0)
  })

  it('refuse un emplacement déjà occupé (409)', async () => {
    const store = new ButtonStore(db)
    await store.create(action)
    await rejectsWith(store.create({ ...action, label: 'Autre' }), 409)
  })

  it('refuse des données invalides (400)', async () => {
    const store = new ButtonStore(db)
    await rejectsWith(store.create({ ...action, url: 'javascript:alert(1)' }), 400)
    assert.equal(store.list().length, 0)
  })

  it('refuse un parent introuvable ou qui n\'est pas un dossier (400)', async () => {
    const store = new ButtonStore(db)
    const leaf = await store.create(action)
    await rejectsWith(store.create({ ...folder, parentId: 'inconnu' }), 400)
    await rejectsWith(store.create({ ...folder, parentId: leaf.id }), 400)
  })

  it('modifie un bouton et conserve la modification', async () => {
    const store = new ButtonStore(db)
    const created = await store.create(action)
    const updated = await store.update(created.id, { label: 'YT', position: 9 })
    assert.deepEqual(updated, { ...created, label: 'YT', position: 9 })
    assert.deepEqual(reopen().get(created.id), updated)
  })

  it('conserve la couleur d\'un bouton, à la création et à la modification', async () => {
    const store = new ButtonStore(db)
    const created = await store.create({ ...action, color: 'teal' })
    assert.equal(created.color, 'teal')
    const updated = await store.update(created.id, { color: 'pink' })
    assert.equal(updated.color, 'pink')
    assert.equal(reopen().get(created.id).color, 'pink')
    await rejectsWith(store.update(created.id, { color: 'rouge' }), 400)
  })

  it('autorise un bouton à garder son propre emplacement', async () => {
    const store = new ButtonStore(db)
    const created = await store.create(action)
    await store.update(created.id, { position: created.position, label: 'Autre' })
  })

  it('refuse de déplacer un bouton sur un emplacement occupé (409)', async () => {
    const store = new ButtonStore(db)
    await store.create(action)
    const other = await store.create(folder)
    await rejectsWith(store.update(other.id, { position: 0 }), 409)
  })

  it('refuse de modifier ou supprimer un bouton inconnu (404)', async () => {
    const store = new ButtonStore(db)
    await rejectsWith(store.update('inconnu', {}), 404)
    await rejectsWith(store.remove('inconnu'), 404)
    assert.throws(() => store.get('inconnu'), error => error instanceof HttpError && error.status === 404)
  })

  it('refuse qu\'un dossier non vide devienne une action (409)', async () => {
    const store = new ButtonStore(db)
    const parent = await store.create(folder)
    await store.create({ ...action, position: 1, parentId: parent.id })
    await rejectsWith(store.update(parent.id, { type: 'action', url: 'https://exemple.fr' }), 409)
  })

  it('supprime un dossier avec tout son contenu, sur plusieurs niveaux', async () => {
    const store = new ButtonStore(db)
    const parent = await store.create(folder)
    const sub = await store.create({ ...folder, parentId: parent.id })
    await store.create({ ...action, position: 1, parentId: sub.id })
    const kept = await store.create({ ...action, position: 2 })

    await store.remove(parent.id)

    assert.deepEqual(store.list(), [kept])
    assert.deepEqual(reopen().list(), [kept])
  })

  it('garde un fichier valide quand plusieurs écritures s\'enchaînent', async () => {
    const store = new ButtonStore(db)
    await Promise.all(Array.from({ length: 10 }, (_, position) => store.create({ ...action, position })))
    const reopened = reopen()
    assert.equal(reopened.list().length, 10)
  })

  describe('move', () => {
    it('déplace un bouton vers un emplacement libre', async () => {
      const store = new ButtonStore(db)
      const youtube = await store.create(action)

      const changed = await store.move(youtube.id, { position: 7 })

      assert.deepEqual(changed, [{ ...youtube, position: 7 }])
      assert.equal(store.get(youtube.id).position, 7)
    })

    it('échange deux boutons quand l\'emplacement est occupé', async () => {
      const store = new ButtonStore(db)
      const youtube = await store.create(action)
      const music = await store.create(folder)

      const changed = await store.move(youtube.id, { position: music.position })

      assert.deepEqual(changed, [{ ...youtube, position: music.position }, { ...music, position: youtube.position }])
      assert.equal(store.get(youtube.id).position, 1)
      assert.equal(store.get(music.id).position, 0)
    })

    it('ne change rien quand le bouton est déjà à cet emplacement', async () => {
      const store = new ButtonStore(db)
      const youtube = await store.create(action)

      assert.deepEqual(await store.move(youtube.id, { position: youtube.position }), [])
      assert.deepEqual(store.get(youtube.id), youtube)
    })

    it('reste dans le dossier du bouton, sans toucher aux autres dossiers', async () => {
      const store = new ButtonStore(db)
      const parent = await store.create(folder)
      const inside = await store.create({ ...action, position: 1, parentId: parent.id })
      const other = await store.create({ ...action, position: 5, parentId: parent.id })
      const rootButton = await store.create({ ...action, position: 5 })

      await store.move(inside.id, { position: 5 })

      assert.equal(store.get(inside.id).position, 5)
      assert.equal(store.get(other.id).position, 1)
      assert.equal(store.get(rootButton.id).position, 5)
    })

    it('conserve le déplacement après réouverture, échange compris', async () => {
      const store = new ButtonStore(db)
      const youtube = await store.create(action)
      const music = await store.create(folder)
      await store.move(youtube.id, { position: music.position })

      const reopened = reopen()
      assert.equal(reopened.get(youtube.id).position, 1)
      assert.equal(reopened.get(music.id).position, 0)
    })

    it('refuse l\'emplacement 0 dans un dossier et le laisse libre', async () => {
      const store = new ButtonStore(db)
      const parent = await store.create(folder)
      const inside = await store.create({ ...action, position: 1, parentId: parent.id })

      await rejectsWith(store.move(inside.id, { position: 0 }), 400)
      assert.equal(store.get(inside.id).position, 1)
    })

    it('autorise l\'emplacement 0 à la racine', async () => {
      const store = new ButtonStore(db)
      const music = await store.create(folder)

      await store.move(music.id, { position: 0 })
      assert.equal(store.get(music.id).position, 0)
    })

    it('refuse un emplacement invalide et un bouton inconnu', async () => {
      const store = new ButtonStore(db)
      const youtube = await store.create(action)

      await rejectsWith(store.move(youtube.id, { position: 28 }), 400)
      await rejectsWith(store.move(youtube.id, {}), 400)
      await rejectsWith(store.move('fantome', { position: 3 }), 404)
    })
  })
})
