import type { Button } from '@/interfaces/button'

// Dimensions de la grille : un seul endroit à changer pour la rendre modulable
// (elles reflètent server/src/buttons/types.ts)
export const COLUMNS = 7
export const ROWS = 5
export const SLOTS = COLUMNS * ROWS
// Dans un dossier, cet emplacement est le bouton retour, comme sur un Stream Deck Elgato
export const BACK_SLOT = 0

/**
 * Range les boutons d'un dossier dans les emplacements de la grille.
 * Renvoie toujours SLOTS entrées : le bouton, ou null pour un emplacement libre.
 * Dans un dossier (parentId non null), BACK_SLOT reste à null : il est réservé au retour.
 */
export function buildSlots (buttons: Button[], parentId: string | null): (Button | null)[] {
  const slots: (Button | null)[] = Array.from({ length: SLOTS }, () => null)
  for (const button of buttons) {
    const reserved = parentId !== null && button.position === BACK_SLOT
    if (button.parentId === parentId && button.position >= 0 && button.position < SLOTS && !reserved) {
      slots[button.position] = button
    }
  }
  return slots
}

/** Le nombre de boutons contenus dans un dossier, sous-dossiers compris (0 pour une action ou un dossier vide) */
export function countContent (buttons: Button[], rootId: string): number {
  return collectSubtree(buttons, rootId).size - 1
}

/** L'identifiant du bouton et ceux de tout son contenu (un dossier, ses sous-dossiers, etc.) */
export function collectSubtree (buttons: Button[], rootId: string): Set<string> {
  const ids = new Set([rootId])
  let grew = true
  while (grew) {
    grew = false
    for (const button of buttons) {
      if (button.parentId !== null && ids.has(button.parentId) && !ids.has(button.id)) {
        ids.add(button.id)
        grew = true
      }
    }
  }
  return ids
}
