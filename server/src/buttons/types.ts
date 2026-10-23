// Dimensions de la grille : un seul endroit à changer pour la rendre modulable
export const COLUMNS = 5
export const ROWS = 7
export const SLOTS = COLUMNS * ROWS

export type ButtonType = 'action' | 'folder'

export interface Button {
  id: string
  /** null : le bouton est à la racine */
  parentId: string | null
  /** Emplacement dans la grille du dossier parent, de 0 à SLOTS - 1 */
  position: number
  label: string
  /** Nom d'icône MDI, ex. "mdi-youtube" */
  icon: string
  type: ButtonType
  /** Actions uniquement : URL http(s) vers laquelle rediriger */
  url?: string
}

export type ButtonInput = Omit<Button, 'id'>
