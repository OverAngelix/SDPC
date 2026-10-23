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
