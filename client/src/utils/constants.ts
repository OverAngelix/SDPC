import type { ButtonType } from '@/interfaces/button'

/** Valeur réservée de `icon` : la case affiche le favicon du site de l'action (feature 17) */
export const FAVICON_ICON = 'favicon'

/** Icône affichée quand le favicon manque : URL invalide, site sans icône, hors ligne ou service bloqué */
export const FAVICON_FALLBACK_ICON = 'mdi-web'

/** Le service renvoie une image générique de cette taille (en pixels) pour un site sans icône */
export const FAVICON_MISSING_SIZE = 16

/** Icône proposée à la création et au changement de type, tant que l'utilisateur n'en a pas choisi une autre */
export const DEFAULT_ICONS: Record<ButtonType, string> = { action: FAVICON_ICON, folder: 'mdi-folder' }

/** Nombre maximal de résultats de la recherche rapide (feature 19) */
export const SEARCH_LIMIT = 8
