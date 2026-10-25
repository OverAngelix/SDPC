import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'
import type { Db } from '../../src/db/database.js'
import { MEMORY_DATABASE, openDatabase } from '../../src/db/database.js'
import { MIGRATIONS } from '../../src/db/migrations.js'

function countButtons (db: Db): number {
  return (db.prepare('SELECT count(*) AS n FROM buttons').get() as { n: number }).n
}

describe('openDatabase', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'sdpc-db-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('crée le fichier de la base, dossier compris, et applique les migrations', () => {
    const db = openDatabase(join(dir, 'data', 'sdpc.db'))
    try {
      assert.equal(db.pragma('user_version', { simple: true }), MIGRATIONS.length)
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all()
      assert.ok(tables.some(table => (table as { name: string }).name === 'buttons'))
    } finally {
      db.close()
    }
  })

  it('conserve les données après réouverture sans rejouer les migrations', () => {
    const file = join(dir, 'sdpc.db')
    const first = openDatabase(file)
    first.prepare("INSERT INTO buttons (id, position, label, icon, type) VALUES ('a', 0, 'A', 'mdi-home', 'folder')").run()
    first.close()

    const second = openDatabase(file)
    try {
      assert.equal(countButtons(second), 1)
      assert.equal(second.pragma('user_version', { simple: true }), MIGRATIONS.length)
    } finally {
      second.close()
    }
  })

  it('active les clés étrangères : supprimer un dossier supprime son contenu', () => {
    const db = openDatabase(MEMORY_DATABASE)
    try {
      db.prepare("INSERT INTO buttons (id, position, label, icon, type) VALUES ('d', 0, 'D', 'mdi-folder', 'folder')").run()
      db.prepare("INSERT INTO buttons (id, parent_id, position, label, icon, type) VALUES ('c', 'd', 1, 'C', 'mdi-home', 'folder')").run()
      db.prepare("DELETE FROM buttons WHERE id = 'd'").run()
      assert.equal(countButtons(db), 0)
    } finally {
      db.close()
    }
  })

  it('refuse un emplacement pris, à la racine comme dans un dossier', () => {
    const db = openDatabase(MEMORY_DATABASE)
    const insert = db.prepare('INSERT INTO buttons (id, parent_id, position, label, icon, type) VALUES (?, ?, ?, ?, ?, ?)')
    try {
      insert.run('d', null, 0, 'D', 'mdi-folder', 'folder')
      assert.throws(() => insert.run('x', null, 0, 'X', 'mdi-home', 'folder'), /UNIQUE/)
      insert.run('a', 'd', 1, 'A', 'mdi-home', 'folder')
      assert.throws(() => insert.run('b', 'd', 1, 'B', 'mdi-home', 'folder'), /UNIQUE/)
    } finally {
      db.close()
    }
  })

  it('refuse une base plus récente que le serveur', async () => {
    const file = join(dir, 'futur.db')
    const db = openDatabase(file)
    db.pragma(`user_version = ${MIGRATIONS.length + 1}`)
    db.close()
    assert.throws(() => openDatabase(file), /plus récente/)
  })
})
