/** `system` suit le thème de l'appareil */
export type Theme = 'light' | 'dark' | 'system'

/** Réglages de l'application d'une personne, enregistrés sur son compte (voir la fiche 11) */
export interface Settings {
  soundEnabled: boolean
  /** Entier de 0 à 100 : multiplie le volume de base des sons */
  volume: number
  /** Survol et animations de la grille */
  effectsEnabled: boolean
  theme: Theme
}
