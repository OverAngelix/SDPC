export type ButtonType = 'action' | 'folder'

/** Noms de couleurs Vuetify : le serveur ne stocke que le nom, le rendu s'adapte au thème. */
export type ButtonColor = 'grey' | 'red' | 'orange' | 'amber' | 'green' | 'teal' | 'cyan' | 'blue' | 'purple' | 'pink'

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
