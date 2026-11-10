import type { Button } from '@/interfaces/button'
import type { SearchResult } from '@/interfaces/search'
import { BACK_SLOT, SLOTS } from '@/grid'
import { SEARCH_LIMIT } from '@/utils/constants'
import { isHttpUrl } from '@/utils/url'

// Classement d'un résultat, du plus pertinent au moins pertinent
const LABEL_START = 0
const WORD_START = 1
const LABEL_CONTAINS = 2
const DOMAIN_CONTAINS = 3

/** Le texte sans casse ni accents (les signes diacritiques séparés par NFD) : « Écran » et « ecran » se comparent à égalité. */
export function normalizeText (text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

/** Le domaine de l'URL d'une action, sans « www. » ; null si l'URL n'est pas une adresse http(s) valide. */
export function domainOf (url: string | undefined): string | null {
  const value = url?.trim() ?? ''
  return isHttpUrl(value) ? new URL(value).hostname.replace(/^www\./, '') : null
}

/** Le rang du bouton pour la saisie (déjà normalisée), null s'il ne correspond pas. */
function rank (label: string, domain: string | null, query: string): number | null {
  if (label.startsWith(query)) {
    return LABEL_START
  }
  if (label.split(/[^\p{L}\p{N}]+/u).some(word => word.startsWith(query))) {
    return WORD_START
  }
  if (label.includes(query)) {
    return LABEL_CONTAINS
  }
  if (domain !== null && normalizeText(domain).includes(query)) {
    return DOMAIN_CONTAINS
  }
  return null
}

/**
 * Les dossiers qui mènent au bouton, de la racine à son parent. null si le bouton n'est pas affiché
 * dans la grille : parent introuvable ou qui n'est pas un dossier, boucle, emplacement hors grille ou réservé au retour.
 */
function pathOf (button: Button, byId: Map<string, Button>): Button[] | null {
  const path: Button[] = []
  let current = button
  while (true) {
    const inFolder = current.parentId !== null
    if (current.position < 0 || current.position >= SLOTS || (inFolder && current.position === BACK_SLOT)) {
      return null
    }
    if (!inFolder) {
      return path
    }
    const parent = byId.get(current.parentId!)
    if (!parent || parent.type !== 'folder' || parent === button || path.includes(parent)) {
      return null
    }
    path.unshift(parent)
    current = parent
  }
}

/**
 * Les boutons, à tous les niveaux, dont le libellé ou le domaine de l'URL correspond à la saisie,
 * sans casse ni accents. Classés : libellé qui commence par la saisie, puis un mot du libellé,
 * puis libellé qui la contient, puis domaine ; à égalité, par ordre alphabétique. Au plus `limit` résultats.
 */
export function searchButtons (buttons: Button[], query: string, limit = SEARCH_LIMIT): SearchResult[] {
  const wanted = normalizeText(query.trim())
  if (wanted === '') {
    return []
  }

  const byId = new Map(buttons.map(button => [button.id, button]))
  const found: { result: SearchResult, rank: number }[] = []
  for (const button of buttons) {
    const domain = button.type === 'action' ? domainOf(button.url) : null
    const buttonRank = rank(normalizeText(button.label), domain, wanted)
    if (buttonRank === null) {
      continue
    }
    const path = pathOf(button, byId)
    if (path !== null) {
      found.push({ result: { button, path, domain }, rank: buttonRank })
    }
  }

  // Tri sur place : la liste vient d'être construite ici
  found.sort((a, b) => a.rank - b.rank || a.result.button.label.localeCompare(b.result.button.label, undefined, { sensitivity: 'base' }))
  return found.slice(0, limit).map(({ result }) => result)
}
