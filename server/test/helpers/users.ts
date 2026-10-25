import type { Db } from '../../src/db/database.js'

/** Insère directement une personne en base (sans hachage, donc sans connexion possible) et renvoie son identifiant. */
export function createUser (db: Db, email = 'jean@exemple.fr'): string {
  const id = `user-${email}`
  db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(id, email, 'sans-connexion', '2026-01-01T00:00:00.000Z')
  return id
}
