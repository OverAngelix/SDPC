export type ButtonType = 'action' | 'folder'

/** Noms de couleurs Vuetify, les mêmes que ceux acceptés par le serveur */
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

/** Champs envoyés pour créer un bouton : le serveur attribue l'identifiant */
export type ButtonInput = Omit<Button, 'id'>

/** Champs modifiables d'un bouton existant : le dossier parent ne l'est pas */
export type ButtonPatch = Partial<Pick<Button, 'label' | 'icon' | 'type' | 'color' | 'position' | 'url'>>
