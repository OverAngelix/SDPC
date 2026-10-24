import type { Button, ButtonColor } from '@/interfaces/button'

/** Les 10 couleurs proposées dans le formulaire, avec leur nom affiché */
export const BUTTON_COLORS: readonly { value: ButtonColor, label: string }[] = [
  { value: 'grey', label: 'Gris' },
  { value: 'red', label: 'Rouge' },
  { value: 'orange', label: 'Orange' },
  { value: 'amber', label: 'Ambre' },
  { value: 'green', label: 'Vert' },
  { value: 'teal', label: 'Turquoise' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'blue', label: 'Bleu' },
  { value: 'purple', label: 'Violet' },
  { value: 'pink', label: 'Rose' },
]

/** Aspect de la grille avant cette feature : un bouton sans couleur s'affiche en gris */
export const DEFAULT_COLOR: ButtonColor = 'grey'

export function colorOf (button: Pick<Button, 'color'> | null | undefined): ButtonColor {
  return button?.color ?? DEFAULT_COLOR
}
