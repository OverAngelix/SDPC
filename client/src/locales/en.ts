import type { Messages } from '@/interfaces/locale'

/** English texts. Same keys and same `{parameters}` as `fr.ts`: a missing key is a type error. */
const en: Messages = {
  languages: {
    fr: 'Français',
    en: 'English',
  },

  validation: {
    required: 'Required',
    minLength: 'At least {min} characters',
  },

  auth: {
    loginTitle: 'Sign in',
    registerTitle: 'Create an account',
    email: 'Email address',
    password: 'Password',
    remember: 'Remember me',
    rememberHint: 'Keeps your email address on this device for your next sign-in',
    submitLogin: 'Sign in',
    submitRegister: 'Create my account',
    haveAccount: 'I already have an account',
    createAccount: 'Create an account',
  },

  grid: {
    loading: 'Loading buttons…',
    loadFailed: 'Could not load the buttons: the server is unreachable.',
    refreshFailed: 'Could not refresh the buttons: the server is unreachable.',
    retry: 'Try again',
    folderMissing: 'This folder could not be found: it may have been deleted.',
    backHome: 'Back to home',
    back: 'Back',
    edit: 'Edit',
    remove: 'Delete',
    add: 'Add a button',
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
