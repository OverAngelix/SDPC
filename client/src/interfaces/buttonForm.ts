import type { ButtonType } from '@/interfaces/button'

/** Valeurs saisies dans le formulaire d'un bouton */
export interface ButtonFormValues {
  type: ButtonType
  label: string
  icon: string
  url: string
}

/** Un message par champ invalide ; un champ absent est valide */
export type ButtonFormErrors = Partial<Record<'label' | 'icon' | 'url', string>>
