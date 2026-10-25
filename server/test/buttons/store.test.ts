import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { HttpError } from '../../src/errors.js'
import { ButtonStore } from '../../src/buttons/store.js'
import type { Db } from '../../src/db/database.js'
import { openDatabase } from '../../src/db/database.js'
import { createUser } from '../helpers/users.js'

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
  let userId: string

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
    userId = createUser(db)
  })

  afterEach(async () => {
    for (const connection of opened) connection.close()
    await rm(dir, { recursive: true, force: true })
  })

  it('crée un bouton, le retrouve et le conserve après réouverture', async () => {
    const store = new ButtonStore(db)
    const created = await store.create(userId, action)
    assert.match(created.id, /^[0-9a-f-]{36}$/)
    assert.deepEqual(store.get(userId, created.id), created)

    const reopened = reopen()
    assert.deepEqual(reopened.list(userId), [created])
  })

  it('liste la racine ou le contenu d\'un dossier', async () => {
    const store = new ButtonStore(db)
    const parent = await store.create(userId, folder)
    const child = await store.create(userId, { ...action, position: 1, parentId: parent.id })
    const root = await store.create(userId, { ...action, position: 2 })

    assert.deepEqual(store.list(userId, null).map(button => button.id), [parent.id, root.id])
    assert.deepEqual(store.list(userId, parent.id), [child])
    assert.equal(store.list(userId).length, 3)
  })

  it('autorise le même emplacement dans deux dossiers différents', async () => {
    const store = new ButtonStore(db)
    const parent = await store.create(userId, folder)
    await store.create(userId, action)
    await store.create(userId, { ...action, position: 1, parentId: parent.id })
    assert.equal(store.list(userId).length, 3)
  })

  it('réserve l\'emplacement 0 d\'un dossier au retour (400), pas celui de la racine', async () => {
    const store = new ButtonStore(db)
    const parent = await store.create(userId, folder)
    await rejectsWith(store.create(userId, { ...action, position: 0, parentId: parent.id }), 400)

    const child = await store.create(userId, { ...action, position: 1, parentId: parent.id })
    await rejectsWith(store.update(userId, child.id, { position: 0 }), 400)

    assert.equal((await store.create(userId, { ...action, position: 0 })).position, 0)
  })

  it('refuse un emplacement déjà occupé (409)', async () => {
    const store = new ButtonStore(db)
    await store.create(userId, action)
    await rejectsWith(store.create(userId, { ...action, label: 'Autre' }), 409)
  })

  it('refuse des données invalides (400)', async () => {
    const store = new ButtonStore(db)
    await rejectsWith(store.create(userId, { ...action, url: 'javascript:alert(1)' }), 400)
    assert.equal(store.list(userId).length, 0)
  })

  it('refuse un parent introuvable ou qui n\'est pas un dossier (400)', async () => {
    const store = new ButtonStore(db)
    const leaf = await store.create(userId, action)
    await rejectsWith(store.create(userId, { ...folder, parentId: 'inconnu' }), 400)
    await rejectsWith(store.create(userId, { ...folder, parentId: leaf.id }), 400)
  })

  it('modifie un bouton et conserve la modification', async () => {
    const store = new ButtonStore(db)
    const created = await store.create(userId, action)
    const updated = await store.update(userId, created.id, { label: 'YT', position: 9 })
    assert.deepEqual(updated, { ...created, label: 'YT', position: 9 })
    assert.deepEqual(reopen().get(userId, created.id), updated)
  })

  it('conserve la couleur d\'un bouton, à la création et à la modification', async () => {
    const store = new ButtonStore(db)
    const created = await store.create(userId, { ...action, color: 'teal' })
    assert.equal(created.color, 'teal')
    const updated = await store.update(userId, created.id, { color: 'pink' })
    assert.equal(updated.color, 'pink')
    assert.equal(reopen().get(userId, created.id).color, 'pink')
    await rejectsWith(store.update(userId, created.id, { color: 'rouge' }), 400)
  })

  it('autorise un bouton à garder son propre emplacement', async () => {
    const store = new ButtonStore(db)
    const created = await store.create(userId, action)
    await store.update(userId, created.id, { position: created.position, label: 'Autre' })
  })

  it('refuse de déplacer un bouton sur un emplacement occupé (409)', async () => {
    const store = new ButtonStore(db)
    await store.create(userId, action)
    const other = await store.create(userId, folder)
    await rejectsWith(store.update(userId, other.id, { position: 0 }), 409)
  })

  it('refuse de modifier ou supprimer un bouton inconnu (404)', async () => {
    const store = new ButtonStore(db)
    await rejectsWith(store.update(userId, 'inconnu', {}), 404)
    await rejectsWith(store.remove(userId, 'inconnu'), 404)
    assert.throws(() => store.get(userId, 'inconnu'), error => error instanceof HttpError && error.status === 404)
  })

  it('refuse qu\'un dossier non vide devienne une action (409)', async () => {
    const store = new ButtonStore(db)
    const parent = await store.create(userId, folder)
    await store.create(userId, { ...action, position: 1, parentId: parent.id })
    await rejectsWith(store.update(userId, parent.id, { type: 'action', url: 'https://exemple.fr' }), 409)
  })

  it('supprime un dossier avec tout son contenu, sur plusieurs niveaux', async () => {
    const store = new ButtonStore(db)
    const parent = await store.create(userId, folder)
    const sub = await store.create(userId, { ...folder, parentId: parent.id })
    await store.create(userId, { ...action, position: 1, parentId: sub.id })
    const kept = await store.create(userId, { ...action, position: 2 })

    await store.remove(userId, parent.id)

    assert.deepEqual(store.list(userId), [kept])
    assert.deepEqual(reopen().list(userId), [kept])
  })

  it('garde un fichier valide quand plusieurs écritures s\'enchaînent', async () => {
    const store = new ButtonStore(db)
    await Promise.all(Array.from({ length: 10 }, (_, position) => store.create(userId, { ...action, position })))
    const reopened = reopen()
    assert.equal(reopened.list(userId).length, 10)
  })

  describe('move', () => {
    it('déplace un bouton vers un emplacement libre', async () => {
      const store = new ButtonStore(db)
      const youtube = await store.create(userId, action)

      const changed = await store.move(userId, youtube.id, { position: 7 })

      assert.deepEqual(changed, [{ ...youtube, position: 7 }])
      assert.equal(store.get(userId, youtube.id).position, 7)
    })

    it('échange deux boutons quand l\'emplacement est occupé', async () => {
      const store = new ButtonStore(db)
      const youtube = await store.create(userId, action)
      const music = await store.create(userId, folder)

      const changed = await store.move(userId, youtube.id, { position: music.position })

      assert.deepEqual(changed, [{ ...youtube, position: music.position }, { ...music, position: youtube.position }])
      assert.equal(store.get(userId, youtube.id).position, 1)
      assert.equal(store.get(userId, music.id).position, 0)
    })

    it('ne change rien quand le bouton est déjà à cet emplacement', async () => {
      const store = new ButtonStore(db)
      const youtube = await store.create(userId, action)

      assert.deepEqual(await store.move(userId, youtube.id, { position: youtube.position }), [])
      assert.deepEqual(store.get(userId, youtube.id), youtube)
    })

    it('reste dans le dossier du bouton, sans toucher aux autres dossiers', async () => {
      const store = new ButtonStore(db)
      const parent = await store.create(userId, folder)
      const inside = await store.create(userId, { ...action, position: 1, parentId: parent.id })
      const other = await store.create(userId, { ...action, position: 5, parentId: parent.id })
      const rootButton = await store.create(userId, { ...action, position: 5 })

      await store.move(userId, inside.id, { position: 5 })

      assert.equal(store.get(userId, inside.id).position, 5)
      assert.equal(store.get(userId, other.id).position, 1)
      assert.equal(store.get(userId, rootButton.id).position, 5)
    })

    it('conserve le déplacement après réouverture, échange compris', async () => {
      const store = new ButtonStore(db)
      const youtube = await store.create(userId, action)
      const music = await store.create(userId, folder)
      await store.move(userId, youtube.id, { position: music.position })

      const reopened = reopen()
      assert.equal(reopened.get(userId, youtube.id).position, 1)
      assert.equal(reopened.get(userId, music.id).position, 0)
    })

    it('refuse l\'emplacement 0 dans un dossier et le laisse libre', async () => {
      const store = new ButtonStore(db)
      const parent = await store.create(userId, folder)
      const inside = await store.create(userId, { ...action, position: 1, parentId: parent.id })

      await rejectsWith(store.move(userId, inside.id, { position: 0 }), 400)
      assert.equal(store.get(userId, inside.id).position, 1)
    })

    it('autorise l\'emplacement 0 à la racine', async () => {
      const store = new ButtonStore(db)
      const music = await store.create(userId, folder)

      await store.move(userId, music.id, { position: 0 })
      assert.equal(store.get(userId, music.id).position, 0)
    })

    it('refuse un emplacement invalide et un bouton inconnu', async () => {
      const store = new ButtonStore(db)
      const youtube = await store.create(userId, action)

      await rejectsWith(store.move(userId, youtube.id, { position: 28 }), 400)
      await rejectsWith(store.move(userId, youtube.id, {}), 400)
      await rejectsWith(store.move(userId, 'fantome', { position: 3 }), 404)
    })
  })
  describe('isolation entre personnes', () => {
    let other: string
    let store: ButtonStore

    beforeEach(() => {
      other = createUser(db, 'marie@exemple.fr')
      store = new ButtonStore(db)
    })

    it('ne liste que les boutons de la personne', async () => {
      const mine = await store.create(userId, action)
      const theirs = await store.create(other, { ...action, label: 'Netflix' })

      assert.deepEqual(store.list(userId), [mine])
      assert.deepEqual(store.list(other, null), [theirs])
    })

    it('traite le bouton d\'une autre personne comme introuvable (404)', async () => {
      const theirs = await store.create(other, action)

      assert.throws(() => store.get(userId, theirs.id), error => error instanceof HttpError && error.status === 404)
      await rejectsWith(store.update(userId, theirs.id, { label: 'Volé' }), 404)
      await rejectsWith(store.move(userId, theirs.id, { position: 3 }), 404)
      await rejectsWith(store.remove(userId, theirs.id), 404)
      assert.deepEqual(store.get(other, theirs.id), theirs)
    })

    it('refuse un dossier parent d\'une autre personne (400)', async () => {
      const theirs = await store.create(other, folder)
      await rejectsWith(store.create(userId, { ...action, position: 1, parentId: theirs.id }), 400)
    })

    it('laisse chaque personne utiliser les mêmes emplacements, à la racine et dans un dossier', async () => {
      for (const id of [userId, other]) {
        await store.create(id, action)
        const parent = await store.create(id, folder)
        await store.create(id, { ...action, position: 1, parentId: parent.id })
      }
      assert.equal(store.list(userId).length, 3)
      assert.equal(store.list(other).length, 3)
    })

    it('échange deux boutons sans toucher à ceux de l\'autre personne', async () => {
      const a = await store.create(userId, action)
      const b = await store.create(userId, folder)
      const theirs = await store.create(other, { ...action, position: 1 })

      await store.move(userId, a.id, { position: 1 })

      assert.equal(store.get(userId, a.id).position, 1)
      assert.equal(store.get(userId, b.id).position, 0)
      assert.equal(store.get(other, theirs.id).position, 1)
    })
  })
})
