/**
 * Codes d'erreur stables des réponses de l'API : le client les traduit dans la langue de la personne
 * (`errors.<code>` dans `client/src/locales/`). Le texte français de la réponse n'est qu'un repli.
 */
export const ERROR_CODES = [
  'invalid_data',
  'invalid_parent_id',
  'session_required',
  'wrong_password',
  'wrong_current_password',
  'invalid_credentials',
  'email_taken',
  'too_many_attempts',
  'button_not_found',
  'folder_not_empty',
  'slot_taken',
  'route_not_found',
  'bad_request',
  'internal_error',
] as const

/**
 * Codes des problèmes relevés sur un champ (réponse 400 ou 409), traduits par le client
 * (`issues.<code>` dans `client/src/locales/`).
 */
export const ISSUE_CODES = [
  'body_not_object',
  'required',
  'too_short',
  'too_long',
  'must_differ',
  'invalid_email',
  'invalid_icon',
  'invalid_choice',
  'integer_range',
  'boolean_expected',
  'unknown_setting',
  'invalid_parent',
  'parent_not_found',
  'reserved_slot',
  'move_unsupported',
  'url_forbidden',
  'url_scheme',
  'invalid_url',
  'empty_folder_first',
  'slot_taken',
  'array_expected',
  'too_many_buttons',
  'duplicate_id',
  'folder_cycle',
] as const
