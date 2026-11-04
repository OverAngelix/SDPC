import { hashToken } from '../auth/store.js'
import { hashPassword, verifyPassword } from '../auth/password.js'
import { HttpError } from '../errors.js'
import type { Db } from '../interfaces/database.js'
import { validateChangePassword, validateDeleteAccount } from './validation.js'


export class AccountStore {
  constructor (private readonly db: Db) {}

  /**
   * Remplace le mot de passe et ferme les sessions des autres appareils ; la session `keepToken` reste ouverte.
   * Mot de passe actuel faux : 403 (un 401 renverrait le client à la page de connexion).
   */
  async changePassword (userId: string, body: unknown, keepToken: string | undefined): Promise<void> {
    const result = validateChangePassword(body)
    if (!result.ok) throw new HttpError(400, 'invalid_data', 'Données invalides', result.errors)

    const { currentPassword, newPassword } = result.value
    await this.checkPassword(userId, currentPassword, 'wrong_current_password', 'Mot de passe actuel incorrect')
    const hash = await hashPassword(newPassword)

    const keep = keepToken === undefined ? null : hashToken(keepToken)
    this.db.transaction(() => {
      this.db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId)
      this.db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash IS NOT ?').run(userId, keep)
    })()
  }

  /** Supprime le compte ; la cascade de la base emporte les boutons, les réglages et les sessions. */
  async deleteAccount (userId: string, body: unknown): Promise<void> {
    const result = validateDeleteAccount(body)
    if (!result.ok) throw new HttpError(400, 'invalid_data', 'Données invalides', result.errors)

    await this.checkPassword(userId, result.value.password, 'wrong_password', 'Mot de passe incorrect')
    this.db.prepare('DELETE FROM users WHERE id = ?').run(userId)
  }

  private async checkPassword (userId: string, password: string, code: 'wrong_password' | 'wrong_current_password', message: string): Promise<void> {
    const row = this.db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as { password_hash: string } | undefined
    if (row === undefined) throw new HttpError(401, 'session_required', 'Connexion requise')
    if (!await verifyPassword(password, row.password_hash)) throw new HttpError(403, code, message)
  }
}
