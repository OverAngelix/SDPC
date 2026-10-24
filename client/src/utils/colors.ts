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

/** Un bouton sans couleur (créé avant cette feature) s'affiche en gris */
export const DEFAULT_COLOR: ButtonColor = 'grey'

/** Le nom de couleur Vuetify d'une case pleine : le gris est foncé pour que le texte blanc reste lisible */
export function solidColor (color: ButtonColor): string {
  return color === DEFAULT_COLOR ? 'grey-darken-2' : color
}

export function colorOf (button: Pick<Button, 'color'> | null | undefined): ButtonColor {
  return button?.color ?? DEFAULT_COLOR
}
