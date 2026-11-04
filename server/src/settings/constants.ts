import type { Locale, LocaleSetting } from '../interfaces/locale.js'
import type { Settings, Theme } from '../interfaces/settings.js'

export const THEMES = ['light', 'dark', 'system'] as const satisfies readonly Theme[]

export const LOCALES = ['fr', 'en'] as const satisfies readonly Locale[]

/** Une langue, ou `system` pour suivre celle de l'appareil */
export const LOCALE_SETTINGS = [...LOCALES, 'system'] as const satisfies readonly LocaleSetting[]

export const VOLUME_MIN = 0
export const VOLUME_MAX = 100

/** Valeurs d'une personne qui n'a encore rien enregistré (les mêmes que celles de la table). */
export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  volume: VOLUME_MAX,
  effectsEnabled: true,
  theme: 'system',
  locale: 'system',
}
