/**
 * Textes en français : la langue de référence. Elle définit la forme (les clés) que `en.ts` doit reproduire.
 * Les paramètres s'écrivent `{nom}`, le même dans toutes les langues.
 */
export default {
  /** Noms des langues : chacun dans sa propre langue, jamais traduits */
  languages: {
    fr: 'Français',
    en: 'English',
  },

  /** Barre d'application, menu et tiroir du compte */
  menu: {
    open: 'Menu',
    account: 'Mon compte',
    grid: 'Grille',
    gridConfig: 'Configuration de la grille',
    appSettings: 'Configuration de l\'application',
    accountWindow: 'Mon compte',
    logout: 'Déconnexion',
  },

  /** Messages affichés par l'application elle-même */
  notices: {
    signOutFailed: 'Déconnexion impossible : le serveur est injoignable.',
    gridCleared: 'Grille effacée ({count} bouton supprimé). | Grille effacée ({count} boutons supprimés).',
    accountDeleted: 'Compte supprimé.',
  },

  /** Fenêtre « Configuration de l'application » */
  settings: {
    language: 'Langue',
    deviceLanguage: 'Appareil',
  },
}
