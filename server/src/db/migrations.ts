/**
 * Migrations de la base, dans l'ordre. L'index + 1 est le numéro de version (`PRAGMA user_version`) :
 * ne jamais modifier une migration déjà livrée, en ajouter une nouvelle à la fin.
 */
export const MIGRATIONS: readonly string[] = [
  // 1 : boutons
  `
  CREATE TABLE buttons (
    id        TEXT PRIMARY KEY,
    parent_id TEXT REFERENCES buttons(id) ON DELETE CASCADE,
    position  INTEGER NOT NULL,
    label     TEXT NOT NULL,
    icon      TEXT NOT NULL,
    type      TEXT NOT NULL CHECK (type IN ('action', 'folder')),
    color     TEXT,
    url       TEXT
  );
  -- Deux NULL étant différents pour SQLite, la racine a son propre index d'unicité
  CREATE UNIQUE INDEX buttons_slot ON buttons (parent_id, position) WHERE parent_id IS NOT NULL;
  CREATE UNIQUE INDEX buttons_root_slot ON buttons (position) WHERE parent_id IS NULL;
  `,  // 2 : comptes et sessions
  `
  CREATE TABLE users (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL
  );
  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );
  CREATE INDEX sessions_user ON sessions (user_id);
  `,  // 3 : une grille par personne. Les boutons d'avant les comptes n'ont pas de propriétaire : ils sont abandonnés
  `
  DROP TABLE buttons;
  CREATE TABLE buttons (
    id        TEXT PRIMARY KEY,
    user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id TEXT REFERENCES buttons(id) ON DELETE CASCADE,
    position  INTEGER NOT NULL,
    label     TEXT NOT NULL,
    icon      TEXT NOT NULL,
    type      TEXT NOT NULL CHECK (type IN ('action', 'folder')),
    color     TEXT,
    url       TEXT
  );
  CREATE UNIQUE INDEX buttons_slot ON buttons (user_id, parent_id, position) WHERE parent_id IS NOT NULL;
  CREATE UNIQUE INDEX buttons_root_slot ON buttons (user_id, position) WHERE parent_id IS NULL;
  `,
]
