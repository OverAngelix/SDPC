import type { ERROR_CODES, ISSUE_CODES } from '../constants.js'

/** Code stable d'une erreur de l'API (voir `ERROR_CODES`) */
export type ErrorCode = (typeof ERROR_CODES)[number]

/** Code stable d'un problème relevé sur un champ (voir `ISSUE_CODES`) */
export type IssueCode = (typeof ISSUE_CODES)[number]

/** Valeurs à insérer dans le texte traduit par le client (`{max}`, `{min}`…) */
export type IssueParams = Record<string, string | number>

/** Un problème relevé sur un champ de la requête : le code et ses paramètres pour le client, le texte français en repli */
export interface Issue {
  /** Le champ concerné ; absent pour un problème qui touche toute la requête */
  field?: string
  code: IssueCode
  message: string
  params?: IssueParams
}
