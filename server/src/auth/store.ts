import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { Db } from '../db/database.js'
import { HttpError } from '../errors.js'
import { hashPassword, verifyPassword } from './password.js'
import type { User } from './types.js'
import { validateCredentials } from './validation.js'

const DAY_MS = 24 * 60 * 60 * 1000

/** Durée d'une session : on ne se reconnecte qu'au bout de 90 jours (cookie et session serveur). */
export const SESSION_DAYS = 90
export const SESSION_MS = SESSION_DAYS * DAY_MS

const BAD_CREDENTIALS = 'E-mail ou mot de passe incorrect'

interface UserRow {
  id: string
  email: string
  password_hash: string
}

function isUniqueViolation (error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'SQLITE_CONSTRAINT_UNIQUE'
}

/** Seule l'empreinte du jeton est stockée : une base copiée ne permet pas de se faire passer pour quelqu'un. */
function hashToken (token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export class AuthStore {
  // Haché d'un mot de passe quelconque, vérifié quand l'adresse est inconnue pour que la durée de réponse ne la trahisse pas
  private decoy: Promise<string> | undefined

  constructor (private readonly db: Db, private readonly now: () => number = Date.now) {}

  async register (body: unknown): Promise<User> {
    const result = validateCredentials(body, 'register')
    if (!result.ok) throw new HttpError(400, 'Données invalides', result.errors)

    const { email, password } = result.value
    const user: User = { id: randomUUID(), email }
    const hash = await hashPassword(password)
    try {
      this.db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
        user.id, email, hash, new Date(this.now()).toISOString(),
      )
    } catch (error) {
      if (isUniqueViolation(error)) throw new HttpError(409, 'Adresse e-mail déjà utilisée')
      throw error
    }
    return user
  }

  /** Vérifie l'e-mail et le mot de passe. Même refus (401) que l'adresse soit inconnue ou le mot de passe faux. */
  async login (body: unknown): Promise<User> {
    const result = validateCredentials(body, 'login')
    if (!result.ok) throw new HttpError(400, 'Données invalides', result.errors)

    const { email, password } = result.value
    const row = this.db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(email) as UserRow | undefined
    const valid = await verifyPassword(password, row?.password_hash ?? await this.decoyHash())
    if (row === undefined || !valid) throw new HttpError(401, BAD_CREDENTIALS)
    return { id: row.id, email: row.email }
  }

  /** Crée une session et renvoie son jeton, à poser dans le cookie. Les sessions expirées sont purgées au passage. */
  createSession (userId: string): string {
    const token = randomBytes(32).toString('base64url')
    this.db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(new Date(this.now()).toISOString())
    this.db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(
      hashToken(token), userId, new Date(this.now() + SESSION_MS).toISOString(),
    )
    return token
  }

  /** La personne à qui appartient ce jeton, ou undefined (jeton inconnu, expiré ou supprimé). */
  userForSession (token: string): User | undefined {
    const row = this.db.prepare(
      `SELECT users.id, users.email FROM sessions JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
    ).get(hashToken(token), new Date(this.now()).toISOString()) as User | undefined
    return row === undefined ? undefined : { id: row.id, email: row.email }
  }

  deleteSession (token: string): void {
    this.db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token))
  }

  private decoyHash (): Promise<string> {
    this.decoy ??= hashPassword(randomBytes(16).toString('hex'))
    return this.decoy
  }
}
