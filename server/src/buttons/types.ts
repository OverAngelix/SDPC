// Dimensions de la grille : un seul endroit à changer pour la rendre modulable
export const COLUMNS = 7
export const ROWS = 4
export const SLOTS = COLUMNS * ROWS
// Dans un dossier, cet emplacement est le bouton retour : il ne peut pas recevoir de bouton
export const BACK_SLOT = 0

export type ButtonType = 'action' | 'folder'

/** Noms de couleurs Vuetify : le serveur ne stocke que le nom, le rendu s'adapte au thème. */
export const BUTTON_COLORS = ['grey', 'red', 'orange', 'amber', 'green', 'teal', 'cyan', 'blue', 'purple', 'pink'] as const
export type ButtonColor = typeof BUTTON_COLORS[number]

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
  /** Couleur de la case ; absente (boutons antérieurs) = gris */
  color?: ButtonColor
  /** Actions uniquement : URL http(s) vers laquelle rediriger */
  url?: string
}

export type ButtonInput = Omit<Button, 'id'>
