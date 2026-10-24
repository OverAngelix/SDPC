import type { Button, ButtonColor, ButtonInput, ButtonType } from './types.js'
import { BACK_SLOT, BUTTON_COLORS, SLOTS } from './types.js'

export const LABEL_MAX_LENGTH = 50
export const URL_MAX_LENGTH = 2048

const BUTTON_TYPES: readonly ButtonType[] = ['action', 'folder']
const ICON_PATTERN = /^mdi-[a-z0-9]+(?:-[a-z0-9]+)*$/
// Seules des redirections web sont autorisées : ni javascript:, ni file:, etc.
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])
const RESERVED_SLOT_ERROR = `position : l'emplacement ${BACK_SLOT} est réservé au bouton retour dans un dossier`

export type ValidationResult<T> = { ok: true, value: T } | { ok: false, errors: string[] }

type Parsed<T> = { value: T } | { error: string }

function isRecord (value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseLabel (value: unknown): Parsed<string> {
  const label = typeof value === 'string' ? value.trim() : ''
  if (label === '') return { error: 'label : texte non vide requis' }
  if (label.length > LABEL_MAX_LENGTH) return { error: `label : ${LABEL_MAX_LENGTH} caractères au plus` }
  return { value: label }
}

function parseIcon (value: unknown): Parsed<string> {
  if (typeof value !== 'string' || !ICON_PATTERN.test(value)) {
    return { error: 'icon : nom d\'icône MDI requis (ex. "mdi-youtube")' }
  }
  return { value }
}

function parseType (value: unknown): Parsed<ButtonType> {
  const type = BUTTON_TYPES.find(candidate => candidate === value)
  return type === undefined ? { error: 'type : "action" ou "folder" attendu' } : { value: type }
}

function parseColor (value: unknown): Parsed<ButtonColor | undefined> {
  if (value === undefined || value === null) return { value: undefined }
  const color = BUTTON_COLORS.find(candidate => candidate === value)
  return color === undefined
    ? { error: `color : l'une de ces couleurs attendue (${BUTTON_COLORS.join(', ')})` }
    : { value: color }
}

function parsePosition (value: unknown): Parsed<number> {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value >= SLOTS) {
    return { error: `position : entier de 0 à ${SLOTS - 1} requis` }
  }
  return { value }
}

function parseParentId (value: unknown): Parsed<string | null> {
  if (value === undefined || value === null) return { value: null }
  if (typeof value !== 'string' || value === '') return { error: 'parentId : identifiant de dossier ou null attendu' }
  return { value }
}

function parseUrl (value: unknown, type: ButtonType | undefined): Parsed<string | undefined> {
  if (type === 'folder') {
    return value === undefined || value === null
      ? { value: undefined }
      : { error: 'url : interdite pour un dossier' }
  }
  if (type === undefined) return { value: undefined }

  if (typeof value !== 'string' || value.trim() === '') return { error: 'url : requise pour une action' }
  const url = value.trim()
  if (url.length > URL_MAX_LENGTH) return { error: `url : ${URL_MAX_LENGTH} caractères au plus` }
  try {
    if (!ALLOWED_PROTOCOLS.has(new URL(url).protocol)) {
      return { error: 'url : seules les adresses http et https sont autorisées' }
    }
  } catch {
    return { error: 'url : adresse invalide' }
  }
  return { value: url }
}

export function validateButtonInput (body: unknown): ValidationResult<ButtonInput> {
  if (!isRecord(body)) return { ok: false, errors: ['Le corps de la requête doit être un objet JSON'] }

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
  if (!isRecord(patch)) return { ok: false, errors: ['Le corps de la requête doit être un objet JSON'] }

  if ('parentId' in patch && (patch.parentId ?? null) !== current.parentId) {
    return { ok: false, errors: ['parentId : le déplacement vers un autre dossier n\'est pas géré'] }
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
  if (!isRecord(body)) return { ok: false, errors: ['Le corps de la requête doit être un objet JSON'] }

  const position = parsePosition(body.position)
  if ('error' in position) return { ok: false, errors: [position.error] }
  if (parentId !== null && position.value === BACK_SLOT) return { ok: false, errors: [RESERVED_SLOT_ERROR] }
  return { ok: true, value: position.value }
}
