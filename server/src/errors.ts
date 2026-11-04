import type { ErrorCode, Issue, IssueCode, IssueParams } from './interfaces/error.js'

export class HttpError extends Error {
  /**
   * @param code Code stable que le client traduit ; `message` est le texte français, en repli
   * @param issues Problèmes relevés sur des champs, le cas échéant
   */
  constructor (
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly issues: Issue[] = [],
  ) {
    super(message)
  }
}

/** Un problème sur un champ (ou sur toute la requête si `field` est absent). */
export function issue (field: string | undefined, code: IssueCode, message: string, params?: IssueParams): Issue {
  return { ...(field === undefined ? {} : { field }), code, message, ...(params === undefined ? {} : { params }) }
}

/** Le problème de tout corps de requête qui n'est pas un objet JSON. */
export function bodyNotObject (): Issue {
  return issue(undefined, 'body_not_object', 'Le corps de la requête doit être un objet JSON')
}
