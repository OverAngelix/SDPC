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

  /** Messages de validation des champs, communs à tous les formulaires */
  validation: {
    required: 'Champ requis',
    minLength: '{min} caractères au moins',
  },

  /** Pages Connexion et Créer un compte */
  auth: {
    loginTitle: 'Connexion',
    registerTitle: 'Créer un compte',
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    remember: 'Se souvenir de moi',
    rememberHint: 'Garde votre adresse e-mail sur cet appareil pour la prochaine connexion',
    submitLogin: 'Se connecter',
    submitRegister: 'Créer mon compte',
    haveAccount: 'J\'ai déjà un compte',
    createAccount: 'Créer un compte',
  },

  /** Grille et états communs à la grille et à sa configuration */
  grid: {
    loading: 'Chargement des boutons…',
    loadFailed: 'Impossible de charger les boutons : le serveur est injoignable.',
    refreshFailed: 'Impossible d\'actualiser les boutons : le serveur est injoignable.',
    retry: 'Réessayer',
    folderMissing: 'Ce dossier est introuvable : il a peut-être été supprimé.',
    backHome: 'Retour à l\'accueil',
    back: 'Retour',
    edit: 'Modifier',
    remove: 'Supprimer',
    add: 'Ajouter un bouton',
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
