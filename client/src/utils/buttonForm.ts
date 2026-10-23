import type { ButtonInput } from '@/interfaces/button'
import type { ButtonFormErrors, ButtonFormValues } from '@/interfaces/buttonForm'
import { isHttpUrl } from '@/utils/url'

// Mêmes limites que le serveur (server/src/buttons/validation.ts), qui reste l'autorité
export const LABEL_MAX_LENGTH = 50
export const URL_MAX_LENGTH = 2048
export const ICON_PATTERN = /^mdi-[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Vérifie les valeurs du formulaire avant l'envoi. Un objet vide veut dire « tout est valide ». */
export function validateButtonForm (values: ButtonFormValues): ButtonFormErrors {
  const errors: ButtonFormErrors = {}

  const label = values.label.trim()
  if (label === '') {
    errors.label = 'Le libellé est obligatoire.'
  } else if (label.length > LABEL_MAX_LENGTH) {
    errors.label = `Le libellé fait ${LABEL_MAX_LENGTH} caractères au plus.`
  }

  if (!ICON_PATTERN.test(values.icon)) {
    errors.icon = 'Nom d\'icône MDI attendu, par exemple « mdi-youtube ».'
  }

  // L'URL ne concerne que les actions : un dossier n'en a pas
  if (values.type === 'action') {
    const url = values.url.trim()
    if (url === '') {
      errors.url = 'L\'URL est obligatoire pour une action.'
    } else if (url.length > URL_MAX_LENGTH) {
      errors.url = `L'URL fait ${URL_MAX_LENGTH} caractères au plus.`
    } else if (!isHttpUrl(url)) {
      errors.url = 'L\'URL doit commencer par http:// ou https://.'
    }
  }

  return errors
}

/** Les champs à envoyer pour créer un bouton à un emplacement donné */
export function toButtonInput (values: ButtonFormValues, parentId: string | null, position: number): ButtonInput {
  return { parentId, position, ...toButtonPatch(values) }
}

/** Les champs à envoyer pour modifier un bouton : pas d'URL pour un dossier */
export function toButtonPatch (values: ButtonFormValues): Pick<ButtonInput, 'type' | 'label' | 'icon' | 'url'> {
  return {
    type: values.type,
    label: values.label.trim(),
    icon: values.icon,
    ...(values.type === 'action' ? { url: values.url.trim() } : {}),
  }
}
