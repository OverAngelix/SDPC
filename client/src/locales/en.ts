import type { Messages } from '@/interfaces/locale'

/** English texts. Same keys and same `{parameters}` as `fr.ts`: a missing key is a type error. */
const en: Messages = {
  languages: {
    fr: 'Français',
    en: 'English',
  },

  menu: {
    open: 'Menu',
    account: 'My account',
    grid: 'Grid',
    gridConfig: 'Grid settings',
    appSettings: 'App settings',
    accountWindow: 'My account',
    logout: 'Sign out',
  },

  notices: {
    signOutFailed: 'Could not sign out: the server is unreachable.',
    gridCleared: 'Grid cleared ({count} button removed). | Grid cleared ({count} buttons removed).',
    accountDeleted: 'Account deleted.',
  },

  settings: {
    language: 'Language',
    deviceLanguage: 'Device',
  },
}

export default en
