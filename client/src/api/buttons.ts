import { http } from './http'

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

export async function fetchButtons (): Promise<Button[]> {
  const { data } = await http.get<Button[]>('/buttons')
  return data
}
