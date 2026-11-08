import type { Button, ButtonColor } from '../interfaces/button.js'

// Dimensions de la grille : un seul endroit à changer pour la rendre modulable
export const COLUMNS = 7
export const ROWS = 4
export const SLOTS = COLUMNS * ROWS
// Dans un dossier, cet emplacement est le bouton retour : il ne peut pas recevoir de bouton
export const BACK_SLOT = 0

export const BUTTON_COLORS = ['grey', 'red', 'orange', 'amber', 'green', 'teal', 'cyan', 'blue', 'purple', 'pink'] as const satisfies readonly ButtonColor[]

/** Import d'une grille entière (migration du mode invité) : au plus ce nombre de boutons */
export const IMPORT_MAX_BUTTONS = 1000

/**
 * Grille d'exemple d'un nouveau compte et d'un nouvel invité. Les identifiants sont provisoires : le serveur
 * en attribue de nouveaux à l'enregistrement. Les dossiers précèdent leur contenu. Les libellés sont des noms
 * propres, identiques dans toutes les langues.
 */
export const EXAMPLE_GRID: readonly Button[] = [
  { id: 'github', parentId: null, position: 0, label: 'GitHub', icon: 'mdi-github', type: 'action', color: 'grey', url: 'https://github.com' },
  { id: 'youtube', parentId: null, position: 1, label: 'YouTube', icon: 'mdi-youtube', type: 'action', color: 'red', url: 'https://www.youtube.com' },
  { id: 'google', parentId: null, position: 2, label: 'Google', icon: 'mdi-google', type: 'folder', color: 'blue' },
  { id: 'maps', parentId: 'google', position: 1, label: 'Maps', icon: 'mdi-google-maps', type: 'action', color: 'green', url: 'https://maps.google.com' },
  { id: 'gmail', parentId: 'google', position: 2, label: 'Gmail', icon: 'mdi-gmail', type: 'action', color: 'red', url: 'https://mail.google.com' },
]
