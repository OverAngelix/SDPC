import type { Button } from '@/interfaces/button'
import type { GridShape } from '@/interfaces/grid'

// Forme de la grille : un seul endroit à changer pour la rendre modulable
// (le nombre d'emplacements reflète server/src/buttons/types.ts). En portrait, les mêmes
// emplacements se rangent en 4 colonnes sur 6 lignes : plus larges, donc plus faciles à toucher
export const LANDSCAPE_SHAPE: GridShape = { columns: 6, rows: 4 }
export const PORTRAIT_SHAPE: GridShape = { columns: 4, rows: 6 }
export const SLOTS = LANDSCAPE_SHAPE.columns * LANDSCAPE_SHAPE.rows
// Dans un dossier, cet emplacement est le bouton retour, comme sur un Stream Deck Elgato
export const BACK_SLOT = 0

/** La forme de la grille : en portrait (écran plus haut que large), 4 colonnes sur 6 lignes ; sinon 6 sur 4 */
export function gridShape (portrait: boolean): GridShape {
  return portrait ? PORTRAIT_SHAPE : LANDSCAPE_SHAPE
}

/** Rang d'une case dans la vague d'apparition : sa diagonale, de la case en haut à gauche vers celle en bas à droite */
export function waveStep (index: number, columns: number): number {
  return (index % columns) + Math.floor(index / columns)
}

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

/**
 * Les identifiants des boutons qui viennent d'apparaître ou de changer d'emplacement entre deux états
 * d'un même dossier (création, déplacement, échange). Vide au premier affichage : une grille qui se
 * remplit après son chargement ne fait pas sauter toutes ses cases.
 */
export function placedIds (before: (Button | null)[], after: (Button | null)[]): string[] {
  if (before.every(slot => slot === null)) {
    return []
  }

  const previous = new Map<string, number>()
  for (const [index, button] of before.entries()) {
    if (button !== null) {
      previous.set(button.id, index)
    }
  }
  const placed: string[] = []
  for (const [index, button] of after.entries()) {
    if (button !== null && previous.get(button.id) !== index) {
      placed.push(button.id)
    }
  }
  return placed
}
