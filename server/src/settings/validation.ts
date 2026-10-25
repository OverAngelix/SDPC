import type { Settings, Theme } from '../interfaces/settings.js'
import type { ValidationResult } from '../interfaces/validation.js'
import { THEMES, VOLUME_MAX, VOLUME_MIN } from './constants.js'

function isRecord (value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Valide une modification partielle des réglages : seuls les champs envoyés changent.
 * Un champ inconnu est refusé plutôt qu'ignoré, pour qu'une faute de frappe ne passe pas inaperçue.
 */
export function validateSettingsPatch (body: unknown): ValidationResult<Partial<Settings>> {
  if (!isRecord(body)) return { ok: false, errors: ['Le corps de la requête doit être un objet JSON'] }

  const value: Partial<Settings> = {}
  const errors: string[] = []

  for (const [key, field] of Object.entries(body)) {
    switch (key) {
      case 'soundEnabled':
      case 'effectsEnabled':
        if (typeof field === 'boolean') value[key] = field
        else errors.push(`${key} : booléen attendu`)
        break
      case 'volume':
        if (typeof field === 'number' && Number.isInteger(field) && field >= VOLUME_MIN && field <= VOLUME_MAX) value.volume = field
        else errors.push(`volume : entier de ${VOLUME_MIN} à ${VOLUME_MAX} requis`)
        break
      case 'theme': {
        const theme = THEMES.find((candidate): candidate is Theme => candidate === field)
        if (theme === undefined) errors.push(`theme : l'une de ces valeurs attendue (${THEMES.join(', ')})`)
        else value.theme = theme
        break
      }
      default:
        errors.push(`${key} : réglage inconnu`)
    }
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, value }
}
