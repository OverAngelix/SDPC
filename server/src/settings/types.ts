export const THEMES = ['light', 'dark', 'system'] as const
export type Theme = typeof THEMES[number]

export const VOLUME_MIN = 0
export const VOLUME_MAX = 100

/** Réglages de l'application d'une personne, communs à tous ses appareils. */
export interface Settings {
  soundEnabled: boolean
  /** Entier de 0 à 100 : multiplie le volume de base des sons */
  volume: number
  /** Survol et animations de la grille */
  effectsEnabled: boolean
  /** `system` suit le thème de l'appareil */
  theme: Theme
}

/** Valeurs d'une personne qui n'a encore rien enregistré (les mêmes que celles de la table). */
export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  volume: VOLUME_MAX,
  effectsEnabled: true,
  theme: 'system',
}
