import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../auth/validation.js'
import { bodyNotObject, issue } from '../errors.js'
import type { Issue } from '../interfaces/error.js'
import type { ChangePasswordBody, DeleteAccountBody } from '../interfaces/account.js'
import type { ValidationResult } from '../interfaces/validation.js'

function isRecord (value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Mot de passe saisi pour prouver son identité : seul un texte raisonnable est exigé, la vérification dit s'il est bon. */
function checkProvided (field: string, value: unknown, errors: Issue[]): string | undefined {
  if (typeof value !== 'string' || value === '') {
    errors.push(issue(field, 'required', 'mot de passe requis'))
  } else if (value.length > PASSWORD_MAX_LENGTH) {
    errors.push(issue(field, 'too_long', `${PASSWORD_MAX_LENGTH} caractères au plus`, { max: PASSWORD_MAX_LENGTH }))
  } else {
    return value
  }
  return undefined
}

export function validateChangePassword (body: unknown): ValidationResult<ChangePasswordBody> {
  if (!isRecord(body)) return { ok: false, errors: [bodyNotObject()] }

  const errors: Issue[] = []
  const currentPassword = checkProvided('currentPassword', body.currentPassword, errors)
  const newPassword = body.newPassword
  if (typeof newPassword !== 'string' || newPassword === '') {
    errors.push(issue('newPassword', 'required', 'mot de passe requis'))
  } else if (newPassword.length < PASSWORD_MIN_LENGTH) {
    errors.push(issue('newPassword', 'too_short', `${PASSWORD_MIN_LENGTH} caractères au moins`, { min: PASSWORD_MIN_LENGTH }))
  } else if (newPassword.length > PASSWORD_MAX_LENGTH) {
    errors.push(issue('newPassword', 'too_long', `${PASSWORD_MAX_LENGTH} caractères au plus`, { max: PASSWORD_MAX_LENGTH }))
  } else if (newPassword === currentPassword) {
    errors.push(issue('newPassword', 'must_differ', 'doit être différent du mot de passe actuel'))
  }

  if (errors.length > 0 || currentPassword === undefined || typeof newPassword !== 'string') return { ok: false, errors }
  return { ok: true, value: { currentPassword, newPassword } }
}

export function validateDeleteAccount (body: unknown): ValidationResult<DeleteAccountBody> {
  if (!isRecord(body)) return { ok: false, errors: [bodyNotObject()] }

  const errors: Issue[] = []
  const password = checkProvided('password', body.password, errors)
  if (errors.length > 0 || password === undefined) return { ok: false, errors }
  return { ok: true, value: { password } }
}
