import type { ButtonColor } from '../interfaces/button.js'

// Dimensions de la grille : un seul endroit à changer pour la rendre modulable
export const COLUMNS = 7
export const ROWS = 4
export const SLOTS = COLUMNS * ROWS
// Dans un dossier, cet emplacement est le bouton retour : il ne peut pas recevoir de bouton
export const BACK_SLOT = 0

export const BUTTON_COLORS = ['grey', 'red', 'orange', 'amber', 'green', 'teal', 'cyan', 'blue', 'purple', 'pink'] as const satisfies readonly ButtonColor[]
