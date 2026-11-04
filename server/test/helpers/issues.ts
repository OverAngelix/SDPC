import type { Issue } from '../../src/interfaces/error.js'
import type { ValidationResult } from '../../src/interfaces/validation.js'

/** Le texte français d'un problème, comme dans `details` : « champ : message ». */
export function text ({ field, message }: Issue): string {
  return field === undefined ? message : `${field} : ${message}`
}

/** Les textes des problèmes d'une validation refusée (liste vide si elle est acceptée). */
export function errorTexts (result: ValidationResult<unknown>): string[] {
  return result.ok ? [] : result.errors.map(text)
}
