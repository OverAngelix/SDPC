import type { Button } from '@/api/buttons'

// Dimensions de la grille : un seul endroit à changer pour la rendre modulable
// (elles reflètent server/src/buttons/types.ts)
export const COLUMNS = 5
export const ROWS = 7
export const SLOTS = COLUMNS * ROWS

/**
 * Range les boutons d'un dossier dans les emplacements de la grille.
 * Renvoie toujours SLOTS entrées : le bouton, ou null pour un emplacement libre.
 */
export function buildSlots (buttons: Button[], parentId: string | null): (Button | null)[] {
  const slots: (Button | null)[] = Array.from({ length: SLOTS }, () => null)
  for (const button of buttons) {
    if (button.parentId === parentId && button.position >= 0 && button.position < SLOTS) {
      slots[button.position] = button
    }
  }
  return slots
}
