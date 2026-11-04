import type { Messages } from '@/interfaces/locale'

/** English texts. Same keys and same `{parameters}` as `fr.ts`: a missing key is a type error. */
const en: Messages = {
  languages: {
    fr: 'Français',
    en: 'English',
  },

  settings: {
    language: 'Language',
    deviceLanguage: 'Device',
  },
}

export default en
