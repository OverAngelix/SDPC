import type { Messages } from '@/interfaces/locale'

/** English texts. Same keys and same `{parameters}` as `fr.ts`: a missing key is a type error. */
const en: Messages = {
  languages: {
    fr: 'Français',
    en: 'English',
  },

  errors: {
    unreachable: 'The server is unreachable.',
    unexpected: 'An unexpected error occurred.',
    serverStatus: 'The server responded with an error ({status}).',
    field: '{field}: {message}',
    invalid_data: 'Invalid data',
    invalid_parent_id: 'Invalid parentId parameter',
    session_required: 'Sign-in required',
    wrong_password: 'Wrong password',
    wrong_current_password: 'Wrong current password',
    invalid_credentials: 'Incorrect email or password',
    email_taken: 'Email address already in use',
    too_many_attempts: 'Too many attempts, please try again later',
    button_not_found: 'Button not found',
    folder_not_empty: 'A folder that is not empty cannot become an action',
    slot_taken: 'Slot already taken',
    route_not_found: 'Route not found',
    bad_request: 'Invalid request',
    internal_error: 'Internal server error',
  },

  issues: {
    body_not_object: 'The request body must be a JSON object',
    required: 'required',
    too_short: 'at least {min} characters',
    too_long: 'at most {max} characters',
    must_differ: 'must be different from the current password',
    invalid_email: 'invalid address',
    invalid_icon: 'an MDI icon name is required (e.g. “mdi-youtube”)',
    invalid_choice: 'one of these values is expected ({values})',
    integer_range: 'an integer from {min} to {max} is required',
    boolean_expected: 'a boolean is expected',
    unknown_setting: 'unknown setting',
    invalid_parent: 'a folder id or null is expected',
    parent_not_found: 'folder not found',
    reserved_slot: 'slot {slot} is reserved for the back button inside a folder',
    move_unsupported: 'moving to another folder is not supported',
    url_forbidden: 'not allowed for a folder',
    url_scheme: 'only http and https addresses are allowed',
    invalid_url: 'invalid address',
    empty_folder_first: 'empty the folder first',
    slot_taken: 'slot {position} is already taken in this folder',
    array_expected: 'list of buttons expected',
    too_many_buttons: '{max} buttons at most',
    duplicate_id: 'identifier already used in the grid',
    folder_cycle: 'folders contain each other',
  },

  common: {
    cancel: 'Cancel',
    close: 'Close',
    irreversible: 'This cannot be undone.',
  },

  validation: {
    required: 'Required',
    minLength: 'At least {min} characters',
    maxLength: 'At most {max} characters',
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
    empty: 'No buttons here. Add some from “My account”, Grid settings.',
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
    bigPicture: 'Big picture (F)',
    logout: 'Sign out',
    clearGrid: 'Clear the grid',
    register: 'Create an account',
    login: 'Sign in',
    leaveGuest: 'Leave guest mode',
  },

  guest: {
    name: 'Guest',
    title: 'Guest mode',
    text: 'Try SDPC without an account: your grid stays in this browser. Create an account whenever you like to keep it everywhere.',
    enter: 'Enter guest mode',
    badge: 'Guest mode',
    register: 'Create an account',
    registerInfo: 'Your guest grid and settings will be saved to this new account.',
    loginWarning: 'Warning: by signing in with an existing account, you will lose your guest grid.',
    migrationFailed: 'Your guest grid could not be saved to the account: it is kept in this browser.',
    retry: 'Retry',
    migrated: 'Guest grid saved to the account.',
  },

  bigPicture: {
    exit: 'Back to normal mode (Esc)',
  },

  welcome: {
    grid: {
      title: 'Welcome to SDPC',
      text: 'Your Stream Deck in the browser: each button of the grid opens a website in a new tab, in one click.',
    },
    folders: {
      title: 'Sort into folders',
      text: 'A folder opens another grid of buttons. Its first slot takes you back.',
    },
    config: {
      title: 'Your turn',
      text: 'Build your grid from “My account”, Grid configuration. The F key shows it full frame.',
    },
    goTo: 'Go to slide {number}',
    skip: 'Skip',
    previous: 'Previous',
    next: 'Next',
    start: 'Let’s go',
  },

  notices: {
    signOutFailed: 'Could not sign out: the server is unreachable.',
    gridCleared: 'Grid cleared ({count} button removed). | Grid cleared ({count} buttons removed).',
    accountDeleted: 'Account deleted.',
  },

  settings: {
    title: 'App settings',
    saveFailed: 'Setting not saved: {reason}',
    sound: 'Sound',
    soundEnabled: 'Sound on',
    volume: 'Volume',
    volumeValue: '{value}%',
    effects: 'Effects',
    effectsEnabled: 'Visual effects (hover, animations)',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    language: 'Language',
    device: 'Device',
  },

  account: {
    title: 'My account',
    password: 'Password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm the new password',
    changePassword: 'Change password',
    passwordChanged: 'Password changed. Your other devices are signed out.',
    sameAsCurrent: 'Must be different from the current password',
    mismatch: 'The two passwords do not match',
    grid: 'Grid',
    gridText: 'Deletes every button and folder of your grid. Your account is kept.',
    clearGrid: 'Clear the grid',
    deleteTitle: 'Delete the account',
    deleteText: 'Permanently deletes your account, your grid and your settings.',
    deleteAccount: 'Delete my account',
  },

  clearGrid: {
    title: 'Clear the whole grid?',
    count: '{count} button deleted, folders and their contents included. | {count} buttons deleted, folders and their contents included.',
    confirm: 'Clear the grid',
  },

  deleteAccount: {
    title: 'Delete your account?',
    warning: 'Your account and your settings will be deleted. This cannot be undone. | Your account, your button and your settings will be deleted. This cannot be undone. | Your account, your {count} buttons and your settings will be deleted. This cannot be undone.',
    password: 'Password',
    confirm: 'Delete my account',
  },
}

export default en
