import type { Settings, Theme } from '../interfaces/settings.js'

export const THEMES = ['light', 'dark', 'system'] as const satisfies readonly Theme[]

export const VOLUME_MIN = 0
export const VOLUME_MAX = 100

/** Valeurs d'une personne qui n'a encore rien enregistré (les mêmes que celles de la table). */
export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  volume: VOLUME_MAX,
  effectsEnabled: true,
  theme: 'system',
}
