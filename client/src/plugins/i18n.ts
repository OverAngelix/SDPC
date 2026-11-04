import type { Locale } from '@/interfaces/locale'
import { createI18n } from 'vue-i18n'
import { en as vuetifyEn, fr as vuetifyFr } from 'vuetify/locale'
import { messages } from '@/locales'
import { DEFAULT_LOCALE } from '@/locales/constants'
import { deviceLocale } from '@/utils/locale'

// Le type `string` (et non `Locale`) est celui qu'attend l'adaptateur de Vuetify
const initialLocale: string = deviceLocale()

// Les textes propres à Vuetify (« Fermer », libellés d'accessibilité…) vivent sous `$vuetify`, à côté des nôtres
export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: DEFAULT_LOCALE,
  // En français, 0 et 1 sont au singulier (« 0 bouton », « 1 bouton »), contrairement à l'anglais
  pluralRules: {
    fr: (choice: number) => choice < 2 ? 0 : 1,
  },
  messages: {
    fr: { $vuetify: vuetifyFr, ...messages.fr },
    en: { $vuetify: vuetifyEn, ...messages.en },
  },
})

/** Langue active de toute l'application : textes, Vuetify (par son adaptateur) et attribut `lang` de la page. */
export function setLocale (locale: Locale) {
  i18n.global.locale.value = locale
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
}

setLocale(deviceLocale())

export default i18n
