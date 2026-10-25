import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { Db } from '../interfaces/database.js'
import { MIGRATIONS } from './migrations.js'

/** Base en mémoire, perdue à la fermeture : pour les tests. */
export const MEMORY_DATABASE = ':memory:'

function migrate (db: Db): void {
  const current = db.pragma('user_version', { simple: true }) as number
  if (current > MIGRATIONS.length) {
    throw new Error(`Base de données plus récente que le serveur (version ${current}, serveur ${MIGRATIONS.length})`)
  }
  for (let version = current; version < MIGRATIONS.length; version++) {
    // Une migration et le numéro de version qui l'accompagne réussissent ou échouent ensemble
    db.transaction(() => {
      db.exec(MIGRATIONS[version])
      db.pragma(`user_version = ${version + 1}`)
    })()
  }
}

/** Ouvre la base SQLite (la crée, dossier compris, si besoin) et applique les migrations manquantes. */
export function openDatabase (file: string): Db {
  if (file !== MEMORY_DATABASE) mkdirSync(dirname(file), { recursive: true })
  const db = new Database(file)
  try {
    db.pragma('foreign_keys = ON')
    // Lectures et écritures ne se bloquent pas ; sans effet sur une base en mémoire
    db.pragma('journal_mode = WAL')
    migrate(db)
  } catch (error) {
    db.close()
    throw error
  }
  return db
}
