import type { Credentials } from '../interfaces/auth.js'
import type { ValidationResult } from '../interfaces/validation.js'

export const EMAIL_MAX_LENGTH = 254
export const PASSWORD_MIN_LENGTH = 8
// Plafond contre les mots de passe démesurés, coûteux à hacher
export const PASSWORD_MAX_LENGTH = 128

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isRecord (value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseEmail (value: unknown): { value: string } | { error: string } {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (email === '') return { error: 'email : adresse requise' }
  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) return { error: 'email : adresse invalide' }
  return { value: email }
}

/**
 * Valide un e-mail et un mot de passe. À l'inscription, le mot de passe doit avoir la longueur voulue ;
 * à la connexion, seul un texte raisonnable est exigé (le refus doit rester le même quelle que soit la cause).
 */
export function validateCredentials (body: unknown, mode: 'register' | 'login'): ValidationResult<Credentials> {
  if (!isRecord(body)) return { ok: false, errors: ['Le corps de la requête doit être un objet JSON'] }

  const email = parseEmail(body.email)
  const password = body.password
  const errors: string[] = []
  if ('error' in email) errors.push(email.error)
  if (typeof password !== 'string' || password === '') {
    errors.push('password : mot de passe requis')
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`password : ${PASSWORD_MAX_LENGTH} caractères au plus`)
  } else if (mode === 'register' && password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`password : ${PASSWORD_MIN_LENGTH} caractères au moins`)
  }
  if (errors.length > 0 || 'error' in email || typeof password !== 'string') return { ok: false, errors }
  return { ok: true, value: { email: email.value, password } }
}
