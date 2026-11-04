import { bodyNotObject, issue } from '../errors.js'
import type { Issue } from '../interfaces/error.js'
import type { LocaleSetting } from '../interfaces/locale.js'
import type { Settings, Theme } from '../interfaces/settings.js'
import type { ValidationResult } from '../interfaces/validation.js'
import { LOCALE_SETTINGS, THEMES, VOLUME_MAX, VOLUME_MIN } from './constants.js'

function isRecord (value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Valide une modification partielle des réglages : seuls les champs envoyés changent.
 * Un champ inconnu est refusé plutôt qu'ignoré, pour qu'une faute de frappe ne passe pas inaperçue.
 */
export function validateSettingsPatch (body: unknown): ValidationResult<Partial<Settings>> {
  if (!isRecord(body)) return { ok: false, errors: [bodyNotObject()] }

  const value: Partial<Settings> = {}
  const errors: Issue[] = []

  for (const [key, field] of Object.entries(body)) {
    switch (key) {
      case 'soundEnabled':
      case 'effectsEnabled':
        if (typeof field === 'boolean') value[key] = field
        else errors.push(issue(key, 'boolean_expected', 'booléen attendu'))
        break
      case 'volume':
        if (typeof field === 'number' && Number.isInteger(field) && field >= VOLUME_MIN && field <= VOLUME_MAX) value.volume = field
        else errors.push(issue('volume', 'integer_range', `entier de ${VOLUME_MIN} à ${VOLUME_MAX} requis`, { min: VOLUME_MIN, max: VOLUME_MAX }))
        break
      case 'theme': {
        const theme = THEMES.find((candidate): candidate is Theme => candidate === field)
        if (theme === undefined) errors.push(issue('theme', 'invalid_choice', `l'une de ces valeurs attendue (${THEMES.join(', ')})`, { values: THEMES.join(', ') }))
        else value.theme = theme
        break
      }
      case 'locale': {
        const locale = LOCALE_SETTINGS.find((candidate): candidate is LocaleSetting => candidate === field)
        if (locale === undefined) errors.push(issue('locale', 'invalid_choice', `l'une de ces valeurs attendue (${LOCALE_SETTINGS.join(', ')})`, { values: LOCALE_SETTINGS.join(', ') }))
        else value.locale = locale
        break
      }
      default:
        errors.push(issue(key, 'unknown_setting', 'réglage inconnu'))
    }
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, value }
}
