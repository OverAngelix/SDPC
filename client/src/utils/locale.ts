import type { Locale, LocaleSetting } from '@/interfaces/locale'
import { DEFAULT_LOCALE } from '@/locales/constants'

/** Langues préférées de l'appareil, de la plus à la moins souhaitée. */
function deviceLanguages (): readonly string[] {
  return typeof navigator === 'undefined' ? [] : navigator.languages
}

/** La langue de l'appareil : le français s'il est en tête de ses préférences, sinon l'anglais (le français quand rien n'est connu). */
export function deviceLocale (languages: readonly string[] = deviceLanguages()): Locale {
  const [first] = languages
  if (first === undefined) {
    return DEFAULT_LOCALE
  }
  return first.toLowerCase().split('-', 1)[0] === 'fr' ? 'fr' : 'en'
}

/** La langue à afficher pour le choix de la personne. */
export function resolveLocale (setting: LocaleSetting, languages?: readonly string[]): Locale {
  return setting === 'system' ? deviceLocale(languages) : setting
}
