import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../auth/validation.js'
import type { ChangePasswordBody, DeleteAccountBody } from '../interfaces/account.js'
import type { ValidationResult } from '../interfaces/validation.js'

function isRecord (value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Mot de passe saisi pour prouver son identité : seul un texte raisonnable est exigé, la vérification dit s'il est bon. */
function checkProvided (field: string, value: unknown, errors: string[]): string | undefined {
  if (typeof value !== 'string' || value === '') {
    errors.push(`${field} : mot de passe requis`)
  } else if (value.length > PASSWORD_MAX_LENGTH) {
    errors.push(`${field} : ${PASSWORD_MAX_LENGTH} caractères au plus`)
  } else {
    return value
  }
  return undefined
}

export function validateChangePassword (body: unknown): ValidationResult<ChangePasswordBody> {
  if (!isRecord(body)) return { ok: false, errors: ['Le corps de la requête doit être un objet JSON'] }

  const errors: string[] = []
  const currentPassword = checkProvided('currentPassword', body.currentPassword, errors)
  const newPassword = body.newPassword
  if (typeof newPassword !== 'string' || newPassword === '') {
    errors.push('newPassword : mot de passe requis')
  } else if (newPassword.length < PASSWORD_MIN_LENGTH) {
    errors.push(`newPassword : ${PASSWORD_MIN_LENGTH} caractères au moins`)
  } else if (newPassword.length > PASSWORD_MAX_LENGTH) {
    errors.push(`newPassword : ${PASSWORD_MAX_LENGTH} caractères au plus`)
  } else if (newPassword === currentPassword) {
    errors.push('newPassword : doit être différent du mot de passe actuel')
  }

  if (errors.length > 0 || currentPassword === undefined || typeof newPassword !== 'string') return { ok: false, errors }
  return { ok: true, value: { currentPassword, newPassword } }
}

export function validateDeleteAccount (body: unknown): ValidationResult<DeleteAccountBody> {
  if (!isRecord(body)) return { ok: false, errors: ['Le corps de la requête doit être un objet JSON'] }

  const errors: string[] = []
  const password = checkProvided('password', body.password, errors)
  if (errors.length > 0 || password === undefined) return { ok: false, errors }
  return { ok: true, value: { password } }
}
