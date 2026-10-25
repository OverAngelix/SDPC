import { HttpError } from '../errors.js'
import type { Db } from '../interfaces/database.js'
import type { Settings, Theme } from '../interfaces/settings.js'
import { DEFAULT_SETTINGS } from './constants.js'
import { validateSettingsPatch } from './validation.js'

interface SettingsRow {
  sound_enabled: number
  volume: number
  effects_enabled: number
  theme: Theme
}

// Colonne de chaque réglage : seules ces clés, validées, entrent dans la requête SQL
const COLUMNS: Record<keyof Settings, string> = {
  soundEnabled: 'sound_enabled',
  volume: 'volume',
  effectsEnabled: 'effects_enabled',
  theme: 'theme',
}

/** Les réglages de chaque personne : chaque méthode ne voit que ceux de `userId`. */
export class SettingsStore {
  constructor (private readonly db: Db) {}

  /** Les réglages enregistrés, ou ceux par défaut tant que la personne n'a rien enregistré. */
  get (userId: string): Settings {
    const row = this.db.prepare(
      'SELECT sound_enabled, volume, effects_enabled, theme FROM user_settings WHERE user_id = ?',
    ).get(userId) as SettingsRow | undefined
    if (row === undefined) return { ...DEFAULT_SETTINGS }
    return {
      soundEnabled: row.sound_enabled === 1,
      volume: row.volume,
      effectsEnabled: row.effects_enabled === 1,
      theme: row.theme,
    }
  }

  /** Modifie les réglages envoyés, laisse les autres, et renvoie l'ensemble. */
  async update (userId: string, body: unknown): Promise<Settings> {
    const result = validateSettingsPatch(body)
    if (!result.ok) throw new HttpError(400, 'Données invalides', result.errors)

    const entries = Object.entries(result.value) as [keyof Settings, boolean | number | string][]
    this.db.transaction(() => {
      // La ligne naît avec les valeurs par défaut de la table au premier enregistrement
      this.db.prepare('INSERT OR IGNORE INTO user_settings (user_id) VALUES (?)').run(userId)
      if (entries.length === 0) return
      const assignments = entries.map(([key]) => `${COLUMNS[key]} = ?`).join(', ')
      const values = entries.map(([, value]) => typeof value === 'boolean' ? Number(value) : value)
      this.db.prepare(`UPDATE user_settings SET ${assignments} WHERE user_id = ?`).run(...values, userId)
    })()
    return this.get(userId)
  }
}
