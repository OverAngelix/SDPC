import type { Messages } from '@/interfaces/locale'

/** English texts. Same keys and same `{parameters}` as `fr.ts`: a missing key is a type error. */
const en: Messages = {
  languages: {
    fr: 'Français',
    en: 'English',
  },

  common: {
    cancel: 'Cancel',
    irreversible: 'This cannot be undone.',
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

  config: {
    helpEmptySlot: 'An empty slot lets you create a button, a folder lets you set up its contents.',
    helpDrag: 'Drag a button onto another slot to move it: if the slot is taken, the two buttons swap places.',
    helpMove: 'Without a mouse, open the button and tap “Move”.',
    moving: 'Moving “{label}”: tap the destination slot (a taken slot swaps places).',
    reserved: 'The first slot of a folder is reserved for the back button: a button cannot be placed there.',
    moveFailed: 'Could not move: {reason}',
    removed: 'Button deleted.',
  },

  buttonForm: {
    editTitle: 'Edit button',
    newTitle: 'New button',
    typeAction: 'Action',
    typeFolder: 'Folder',
    label: 'Label',
    url: 'URL',
    move: 'Move',
    save: 'Save',
    created: 'Button created.',
    updated: 'Button updated.',
    errors: {
      labelRequired: 'The label is required.',
      labelTooLong: 'The label can be at most {max} characters long.',
      iconInvalid: 'An MDI icon name is expected, for example “mdi-youtube”.',
      urlRequired: 'The URL is required for an action.',
      urlTooLong: 'The URL can be at most {max} characters long.',
      urlScheme: 'The URL must start with http:// or https://.',
    },
  },

  pickers: {
    color: 'Color',
    icon: 'Icon',
    iconPlaceholder: 'Pick one below or type an MDI icon name (mdi-youtube)',
    iconsPrevious: 'Previous icons',
    iconsNext: 'Next icons',
  },

  colors: {
    grey: 'Grey',
    red: 'Red',
    orange: 'Orange',
    amber: 'Amber',
    green: 'Green',
    teal: 'Teal',
    cyan: 'Cyan',
    blue: 'Blue',
    purple: 'Purple',
    pink: 'Pink',
  },

  deleteButton: {
    titleButton: 'Delete the button “{label}”?',
    titleFolder: 'Delete the folder “{label}”?',
    contentCount: '{count} item deleted with the folder | {count} items deleted with the folder',
    confirmButton: 'Delete',
    confirmFolder: 'Delete folder',
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
