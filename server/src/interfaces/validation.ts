/** Résultat d'une validation : la valeur nettoyée, ou la liste des erreurs à renvoyer en 400 */
export type ValidationResult<T> = { ok: true, value: T } | { ok: false, errors: string[] }
