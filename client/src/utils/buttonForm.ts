import type { ButtonInput, ButtonType } from '@/interfaces/button'
import type { ButtonFormErrors, ButtonFormValues } from '@/interfaces/buttonForm'
import { i18n } from '@/plugins/i18n'
import { DEFAULT_ICONS, FAVICON_ICON } from '@/utils/constants'
import { isHttpUrl } from '@/utils/url'

// Mêmes limites que le serveur (server/src/buttons/validation.ts), qui reste l'autorité
export const LABEL_MAX_LENGTH = 50
export const URL_MAX_LENGTH = 2048
export const ICON_PATTERN = /^mdi-[a-z0-9]+(?:-[a-z0-9]+)*$/

// Hors composant : la langue active est celle de l'instance partagée
const t = i18n.global.t

/** Vérifie les valeurs du formulaire avant l'envoi. Un objet vide veut dire « tout est valide ». */
export function validateButtonForm (values: ButtonFormValues): ButtonFormErrors {
  const errors: ButtonFormErrors = {}

  const label = values.label.trim()
  if (label === '') {
    errors.label = t('buttonForm.errors.labelRequired')
  } else if (label.length > LABEL_MAX_LENGTH) {
    errors.label = t('buttonForm.errors.labelTooLong', { max: LABEL_MAX_LENGTH })
  }

  // L'icône du site suppose une URL : réservée aux actions
  if (values.icon === FAVICON_ICON) {
    if (values.type !== 'action') {
      errors.icon = t('buttonForm.errors.faviconNeedsUrl')
    }
  } else if (!ICON_PATTERN.test(values.icon)) {
    errors.icon = t('buttonForm.errors.iconInvalid')
  }

  // L'URL ne concerne que les actions : un dossier n'en a pas
  if (values.type === 'action') {
    const url = values.url.trim()
    if (url === '') {
      errors.url = t('buttonForm.errors.urlRequired')
    } else if (url.length > URL_MAX_LENGTH) {
      errors.url = t('buttonForm.errors.urlTooLong', { max: URL_MAX_LENGTH })
    } else if (!isHttpUrl(url)) {
      errors.url = t('buttonForm.errors.urlScheme')
    }
  }

  return errors
}

/**
 * L'icône après un changement de type : l'icône par défaut suit le type, l'icône du site devient celle d'un dossier
 * (qui n'a pas d'URL) ; une icône choisie par l'utilisateur est gardée.
 */
export function iconAfterTypeChange (icon: string, from: ButtonType, to: ButtonType): string {
  return icon === DEFAULT_ICONS[from] || (to === 'folder' && icon === FAVICON_ICON) ? DEFAULT_ICONS[to] : icon
}

/** Les champs à envoyer pour créer un bouton à un emplacement donné */
export function toButtonInput (values: ButtonFormValues, parentId: string | null, position: number): ButtonInput {
  return { parentId, position, ...toButtonPatch(values) }
}

/** Les champs à envoyer pour modifier un bouton : pas d'URL pour un dossier */
export function toButtonPatch (values: ButtonFormValues): Pick<ButtonInput, 'type' | 'label' | 'icon' | 'color' | 'url'> {
  return {
    type: values.type,
    label: values.label.trim(),
    icon: values.icon,
    color: values.color,
    ...(values.type === 'action' ? { url: values.url.trim() } : {}),
  }
}
