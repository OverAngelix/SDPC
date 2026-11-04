import type { Button, ButtonColor } from '@/interfaces/button'

/** Les 10 couleurs proposées dans le formulaire ; leur nom affiché est dans les textes (`colors.<couleur>`) */
export const BUTTON_COLORS: readonly ButtonColor[] = [
  'grey',
  'red',
  'orange',
  'amber',
  'green',
  'teal',
  'cyan',
  'blue',
  'purple',
  'pink',
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
