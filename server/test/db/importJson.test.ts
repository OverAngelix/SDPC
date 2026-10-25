import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { ButtonStore } from '../../src/buttons/store.js'
import type { Db } from '../../src/db/database.js'
import { MEMORY_DATABASE, openDatabase } from '../../src/db/database.js'
import { importButtons } from '../../src/db/importJson.js'

const action = { position: 0, label: 'YouTube', icon: 'mdi-youtube', type: 'action', url: 'https://www.youtube.com' }
const folder = { position: 1, label: 'Musique', icon: 'mdi-folder', type: 'folder' }
const button = { id: 'a', parentId: null, ...action }

describe('importButtons', () => {
  let dir: string
  let db: Db

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'sdpc-import-'))
    db = openDatabase(MEMORY_DATABASE)
  })

  afterEach(async () => {
    db.close()
    await rm(dir, { recursive: true, force: true })
  })

  async function importContent (content: string) {
    const path = join(dir, 'buttons.json')
    await writeFile(path, content)
    return importButtons(db, path)
  }

  async function importButtonList (buttons: unknown[]) {
    return importContent(JSON.stringify({ buttons }))
  }

  it('importe les boutons, dossiers et contenu compris, même si le contenu précède son dossier', async () => {
    const parent = { id: 'p', parentId: null, ...folder }
    const child = { id: 'c', parentId: 'p', ...action, position: 1, color: 'teal' }

    assert.equal(await importButtonList([child, parent]), 2)

    const store = new ButtonStore(db)
    assert.deepEqual(store.get('c'), child)
    assert.deepEqual(store.list('p'), [child])
  })

  it('est sans effet quand on le relance', async () => {
    assert.equal(await importButtonList([button]), 1)
    assert.equal(await importButtonList([button]), 0)
    assert.equal(new ButtonStore(db).list().length, 1)
  })

  it('n\'importe rien si un emplacement est déjà pris dans la base', async () => {
    await new ButtonStore(db).create(action)
    await assert.rejects(importButtonList([button, { id: 'b', parentId: null, ...folder, position: 5 }]), /UNIQUE/)
    assert.equal(new ButtonStore(db).list().length, 1)
  })

  it('refuse un JSON illisible', async () => {
    await assert.rejects(importContent('{pas du json'), /illisible/)
  })

  it('refuse un contenu sans tableau buttons', async () => {
    await assert.rejects(importContent('{}'), /buttons/)
  })

  it('refuse un bouton invalide', async () => {
    await assert.rejects(importButtonList([{ ...button, url: 'javascript:alert(1)' }]), /invalide/)
    await assert.rejects(importButtonList([{ ...button, id: undefined }]), /invalide/)
  })

  it('refuse une couleur inconnue mais relit un bouton sans couleur', async () => {
    await assert.rejects(importButtonList([{ ...button, color: 'rouge' }]), /invalide/)
    await importButtonList([button])
    assert.equal(new ButtonStore(db).get('a').color, undefined)
  })

  it('refuse les identifiants et emplacements en double', async () => {
    await assert.rejects(importButtonList([button, { ...button, position: 1 }]), /identifiant/)
    await assert.rejects(importButtonList([button, { ...button, id: 'b' }]), /emplacement/)
  })

  it('refuse un bouton sur l\'emplacement 0 d\'un dossier', async () => {
    const parent = { id: 'p', parentId: null, ...folder }
    await assert.rejects(importButtonList([parent, { ...button, parentId: 'p', position: 0 }]), /invalide/)
  })

  it('refuse un parent qui n\'existe pas, sans rien importer', async () => {
    await assert.rejects(importButtonList([button, { ...button, id: 'b', parentId: 'fantome', position: 1 }]), /parent/)
    assert.equal(new ButtonStore(db).list().length, 0)
  })
})
