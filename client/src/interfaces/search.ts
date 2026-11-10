import type { Button } from '@/interfaces/button'

/** Un bouton trouvé par la recherche rapide, avec les dossiers qui le contiennent */
export interface SearchResult {
  button: Button
  /** Les dossiers à traverser pour l'atteindre, de la racine à son parent ([] à la racine) */
  path: Button[]
  /** Domaine de l'URL d'une action, sans « www. » ; null pour un dossier ou une URL invalide */
  domain: string | null
}
