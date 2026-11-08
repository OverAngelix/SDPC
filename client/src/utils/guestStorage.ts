import type { Button } from '@/interfaces/button'
import type { LocaleSetting } from '@/interfaces/locale'
import type { Settings, Theme } from '@/interfaces/settings'

export const GUEST_STORAGE_KEY = 'sdpc.guest'
export const GUEST_BUTTONS_KEY = 'sdpc.guest.buttons'
export const GUEST_SETTINGS_KEY = 'sdpc.guest.settings'

const THEMES: readonly Theme[] = ['light', 'dark', 'system']
const LOCALE_SETTINGS: readonly LocaleSetting[] = ['fr', 'en', 'system']

// Stockage refusé (navigation privée) : le mode invité tient en mémoire, le temps de l'onglet
const memory = new Map<string, string>()

function read (key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return memory.get(key) ?? null
  }
}

function write (key: string, value: string | null) {
  try {
    if (value === null) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, value)
    }
  } catch {
    if (value === null) {
      memory.delete(key)
    } else {
      memory.set(key, value)
    }
  }
}

function parse (text: string | null): unknown {
  if (text === null) {
    return null
  }
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function isRecord (value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Une donnée abîmée à la main ne doit pas casser la grille : seuls les boutons bien formés sont repris
function isButton (value: unknown): value is Button {
  return isRecord(value)
    && typeof value.id === 'string'
    && (value.parentId === null || typeof value.parentId === 'string')
    && typeof value.position === 'number'
    && typeof value.label === 'string'
    && typeof value.icon === 'string'
    && (value.type === 'action' || value.type === 'folder')
}

/** Le mode invité est-il actif sur cet appareil ? */
export function readGuestActive (): boolean {
  return read(GUEST_STORAGE_KEY) === '1'
}

export function writeGuestActive (active: boolean) {
  write(GUEST_STORAGE_KEY, active ? '1' : null)
}

/** La grille de l'invité, ou null s'il n'en a jamais eu (ou si elle est illisible). */
export function readGuestButtons (): Button[] | null {
  const value = parse(read(GUEST_BUTTONS_KEY))
  return Array.isArray(value) ? value.filter(button => isButton(button)) : null
}

export function writeGuestButtons (buttons: Button[]) {
  write(GUEST_BUTTONS_KEY, JSON.stringify(buttons))
}

/** Les réglages enregistrés par l'invité : seules les valeurs du bon type sont reprises. */
export function readGuestSettings (): Partial<Settings> {
  const value = parse(read(GUEST_SETTINGS_KEY))
  if (!isRecord(value)) {
    return {}
  }
  const settings: Partial<Settings> = {}
  if (typeof value.soundEnabled === 'boolean') {
    settings.soundEnabled = value.soundEnabled
  }
  if (typeof value.volume === 'number') {
    settings.volume = value.volume
  }
  if (typeof value.effectsEnabled === 'boolean') {
    settings.effectsEnabled = value.effectsEnabled
  }
  const theme = THEMES.find(candidate => candidate === value.theme)
  if (theme !== undefined) {
    settings.theme = theme
  }
  const locale = LOCALE_SETTINGS.find(candidate => candidate === value.locale)
  if (locale !== undefined) {
    settings.locale = locale
  }
  return settings
}

export function writeGuestSettings (settings: Settings) {
  write(GUEST_SETTINGS_KEY, JSON.stringify(settings))
}

/** Efface tout ce que l'invité a laissé sur cet appareil : grille, réglages et mode. */
export function clearGuestData () {
  for (const key of [GUEST_STORAGE_KEY, GUEST_BUTTONS_KEY, GUEST_SETTINGS_KEY]) {
    write(key, null)
  }
}
