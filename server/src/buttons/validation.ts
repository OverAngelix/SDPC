import { bodyNotObject, issue } from '../errors.js'
import type { Button, ButtonColor, ButtonInput, ButtonType } from '../interfaces/button.js'
import type { Issue } from '../interfaces/error.js'
import type { ValidationResult } from '../interfaces/validation.js'
import { BACK_SLOT, BUTTON_COLORS, SLOTS } from './constants.js'

export const LABEL_MAX_LENGTH = 50
export const URL_MAX_LENGTH = 2048

const BUTTON_TYPES: readonly ButtonType[] = ['action', 'folder']
const ICON_PATTERN = /^mdi-[a-z0-9]+(?:-[a-z0-9]+)*$/
// Seules des redirections web sont autorisées : ni javascript:, ni file:, etc.
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])
const RESERVED_SLOT_ERROR = issue('position', 'reserved_slot', `l'emplacement ${BACK_SLOT} est réservé au bouton retour dans un dossier`, { slot: BACK_SLOT })

type Parsed<T> = { value: T } | { error: Issue }

function isRecord (value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseLabel (value: unknown): Parsed<string> {
  const label = typeof value === 'string' ? value.trim() : ''
  if (label === '') return { error: issue('label', 'required', 'texte non vide requis') }
  if (label.length > LABEL_MAX_LENGTH) return { error: issue('label', 'too_long', `${LABEL_MAX_LENGTH} caractères au plus`, { max: LABEL_MAX_LENGTH }) }
  return { value: label }
}

function parseIcon (value: unknown): Parsed<string> {
  if (typeof value !== 'string' || !ICON_PATTERN.test(value)) {
    return { error: issue('icon', 'invalid_icon', 'nom d\'icône MDI requis (ex. "mdi-youtube")') }
  }
  return { value }
}

function parseType (value: unknown): Parsed<ButtonType> {
  const type = BUTTON_TYPES.find(candidate => candidate === value)
  return type === undefined ? { error: issue('type', 'invalid_choice', '"action" ou "folder" attendu', { values: BUTTON_TYPES.join(', ') }) } : { value: type }
}

function parseColor (value: unknown): Parsed<ButtonColor | undefined> {
  if (value === undefined || value === null) return { value: undefined }
  const color = BUTTON_COLORS.find(candidate => candidate === value)
  return color === undefined
    ? { error: issue('color', 'invalid_choice', `l'une de ces couleurs attendue (${BUTTON_COLORS.join(', ')})`, { values: BUTTON_COLORS.join(', ') }) }
    : { value: color }
}

function parsePosition (value: unknown): Parsed<number> {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value >= SLOTS) {
    return { error: issue('position', 'integer_range', `entier de 0 à ${SLOTS - 1} requis`, { min: 0, max: SLOTS - 1 }) }
  }
  return { value }
}

function parseParentId (value: unknown): Parsed<string | null> {
  if (value === undefined || value === null) return { value: null }
  if (typeof value !== 'string' || value === '') return { error: issue('parentId', 'invalid_parent', 'identifiant de dossier ou null attendu') }
  return { value }
}

function parseUrl (value: unknown, type: ButtonType | undefined): Parsed<string | undefined> {
  if (type === 'folder') {
    return value === undefined || value === null
      ? { value: undefined }
      : { error: issue('url', 'url_forbidden', 'interdite pour un dossier') }
  }
  if (type === undefined) return { value: undefined }

  if (typeof value !== 'string' || value.trim() === '') return { error: issue('url', 'required', 'requise pour une action') }
  const url = value.trim()
  if (url.length > URL_MAX_LENGTH) return { error: issue('url', 'too_long', `${URL_MAX_LENGTH} caractères au plus`, { max: URL_MAX_LENGTH }) }
  try {
    if (!ALLOWED_PROTOCOLS.has(new URL(url).protocol)) {
      return { error: issue('url', 'url_scheme', 'seules les adresses http et https sont autorisées') }
    }
  } catch {
    return { error: issue('url', 'invalid_url', 'adresse invalide') }
  }
  return { value: url }
}

export function validateButtonInput (body: unknown): ValidationResult<ButtonInput> {
  if (!isRecord(body)) return { ok: false, errors: [bodyNotObject()] }

  const label = parseLabel(body.label)
  const icon = parseIcon(body.icon)
  const type = parseType(body.type)
  const color = parseColor(body.color)
  const position = parsePosition(body.position)
  const parentId = parseParentId(body.parentId)
  const url = parseUrl(body.url, 'value' in type ? type.value : undefined)

  const errors = [label, icon, type, color, position, parentId, url].flatMap(field => 'error' in field ? [field.error] : [])
  if ('error' in label || 'error' in icon || 'error' in type || 'error' in color || 'error' in position || 'error' in parentId || 'error' in url) {
    return { ok: false, errors }
  }
  if (parentId.value !== null && position.value === BACK_SLOT) {
    return { ok: false, errors: [RESERVED_SLOT_ERROR] }
  }

  return {
    ok: true,
    value: {
      parentId: parentId.value,
      position: position.value,
      label: label.value,
      icon: icon.value,
      type: type.value,
      ...(color.value === undefined ? {} : { color: color.value }),
      ...(url.value === undefined ? {} : { url: url.value }),
    },
  }
}

/**
 * Applique une modification partielle à un bouton existant, puis valide le résultat complet.
 * Le dossier parent n'est pas modifiable ici (déplacement entre dossiers : feature 05).
 */
export function mergeButtonPatch (current: Button, patch: unknown): ValidationResult<ButtonInput> {
  if (!isRecord(patch)) return { ok: false, errors: [bodyNotObject()] }

  if ('parentId' in patch && (patch.parentId ?? null) !== current.parentId) {
    return { ok: false, errors: [issue('parentId', 'move_unsupported', 'le déplacement vers un autre dossier n\'est pas géré')] }
  }

  const merged = {
    parentId: current.parentId,
    position: patch.position ?? current.position,
    label: patch.label ?? current.label,
    icon: patch.icon ?? current.icon,
    type: patch.type ?? current.type,
    color: patch.color ?? current.color,
    // Un bouton qui devient dossier perd son URL, sauf si la requête en fournit une (alors refusée)
    url: patch.url === undefined && patch.type === 'folder' ? undefined : patch.url ?? current.url,
  }
  return validateButtonInput(merged)
}

/** Valide le corps d'un déplacement (`{ position }`) vers un autre emplacement du dossier `parentId`. */
export function validateMoveInput (parentId: string | null, body: unknown): ValidationResult<number> {
  if (!isRecord(body)) return { ok: false, errors: [bodyNotObject()] }

  const position = parsePosition(body.position)
  if ('error' in position) return { ok: false, errors: [position.error] }
  if (parentId !== null && position.value === BACK_SLOT) return { ok: false, errors: [RESERVED_SLOT_ERROR] }
  return { ok: true, value: position.value }
}
