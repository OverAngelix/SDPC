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

  /** Erreurs de l'API : un texte par code d'erreur du serveur (`ERROR_CODES`), et les erreurs que le client constate lui-même */
  errors: {
    unreachable: 'Le serveur est injoignable.',
    unexpected: 'Une erreur inattendue est survenue.',
    serverStatus: 'Le serveur a répondu avec une erreur ({status}).',
    /** Un problème sur un champ : le nom du champ de l'API, puis le problème */
    field: '{field} : {message}',
    invalid_data: 'Données invalides',
    invalid_parent_id: 'Paramètre parentId invalide',
    session_required: 'Connexion requise',
    wrong_password: 'Mot de passe incorrect',
    wrong_current_password: 'Mot de passe actuel incorrect',
    invalid_credentials: 'E-mail ou mot de passe incorrect',
    email_taken: 'Adresse e-mail déjà utilisée',
    too_many_attempts: 'Trop de tentatives, réessayez plus tard',
    button_not_found: 'Bouton introuvable',
    folder_not_empty: 'Un dossier non vide ne peut pas devenir une action',
    slot_taken: 'Emplacement déjà occupé',
    route_not_found: 'Route introuvable',
    bad_request: 'Requête invalide',
    internal_error: 'Erreur interne du serveur',
  },

  /** Problèmes relevés sur un champ : un texte par code (`ISSUE_CODES`) */
  issues: {
    body_not_object: 'Le corps de la requête doit être un objet JSON',
    required: 'obligatoire',
    too_short: '{min} caractères au moins',
    too_long: '{max} caractères au plus',
    must_differ: 'doit être différent du mot de passe actuel',
    invalid_email: 'adresse invalide',
    invalid_icon: 'nom d\'icône MDI requis (ex. « mdi-youtube »)',
    invalid_choice: 'l\'une de ces valeurs attendue ({values})',
    integer_range: 'entier de {min} à {max} requis',
    boolean_expected: 'booléen attendu',
    unknown_setting: 'réglage inconnu',
    invalid_parent: 'identifiant de dossier ou null attendu',
    parent_not_found: 'dossier introuvable',
    reserved_slot: 'l\'emplacement {slot} est réservé au bouton retour dans un dossier',
    move_unsupported: 'le déplacement vers un autre dossier n\'est pas géré',
    url_forbidden: 'interdite pour un dossier',
    url_scheme: 'seules les adresses http et https sont autorisées',
    invalid_url: 'adresse invalide',
    empty_folder_first: 'vider le dossier d\'abord',
    slot_taken: 'l\'emplacement {position} est pris dans ce dossier',
  },

  /** Boutons et phrases communs à plusieurs fenêtres */
  common: {
    cancel: 'Annuler',
    close: 'Fermer',
    irreversible: 'Cette action est définitive.',
  },

  /** Messages de validation des champs, communs à tous les formulaires */
  validation: {
    required: 'Champ requis',
    minLength: '{min} caractères au moins',
    maxLength: '{max} caractères au plus',
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
    empty: 'Aucun bouton ici. Ajoutez-en depuis « Mon compte », Configuration de la grille.',
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

  /** Page « Configuration de la grille » */
  config: {
    helpEmptySlot: 'Un emplacement vide permet de créer un bouton, un dossier de configurer son contenu.',
    helpDrag: 'Glissez un bouton sur un autre emplacement pour le déplacer : s\'il est occupé, les deux boutons échangent leur place.',
    helpMove: 'Sans souris, ouvrez le bouton puis touchez « Déplacer ».',
    moving: 'Déplacement de « {label} » : touchez l\'emplacement de destination (un bouton occupé échange sa place).',
    reserved: 'La première case d\'un dossier est réservée au bouton retour : on ne peut pas y placer un bouton.',
    moveFailed: 'Déplacement impossible : {reason}',
    removed: 'Bouton supprimé.',
  },

  /** Formulaire d'un bouton */
  buttonForm: {
    editTitle: 'Modifier le bouton',
    newTitle: 'Nouveau bouton',
    typeAction: 'Action',
    typeFolder: 'Dossier',
    label: 'Libellé',
    url: 'URL',
    move: 'Déplacer',
    save: 'Enregistrer',
    created: 'Bouton créé.',
    updated: 'Bouton modifié.',
    errors: {
      labelRequired: 'Le libellé est obligatoire.',
      labelTooLong: 'Le libellé fait {max} caractères au plus.',
      iconInvalid: 'Nom d\'icône MDI attendu, par exemple « mdi-youtube ».',
      urlRequired: 'L\'URL est obligatoire pour une action.',
      urlTooLong: 'L\'URL fait {max} caractères au plus.',
      urlScheme: 'L\'URL doit commencer par http:// ou https://.',
    },
  },

  /** Choix de la couleur et de l'icône */
  pickers: {
    color: 'Couleur',
    icon: 'Icône',
    iconPlaceholder: 'Choisir ci-dessous ou saisir un nom d\'icône MDI (mdi-youtube)',
    iconsPrevious: 'Icônes précédentes',
    iconsNext: 'Icônes suivantes',
  },

  /** Noms des couleurs proposées */
  colors: {
    grey: 'Gris',
    red: 'Rouge',
    orange: 'Orange',
    amber: 'Ambre',
    green: 'Vert',
    teal: 'Turquoise',
    cyan: 'Cyan',
    blue: 'Bleu',
    purple: 'Violet',
    pink: 'Rose',
  },

  /** Confirmation de la suppression d'un bouton ou d'un dossier */
  deleteButton: {
    titleButton: 'Supprimer le bouton « {label} » ?',
    titleFolder: 'Supprimer le dossier « {label} » ?',
    contentCount: '{count} élément supprimé avec le dossier | {count} éléments supprimés avec le dossier',
    confirmButton: 'Supprimer',
    confirmFolder: 'Supprimer le dossier',
  },

  /** Barre d'application, menu et tiroir du compte */
  menu: {
    open: 'Menu',
    account: 'Mon compte',
    grid: 'Grille',
    gridConfig: 'Configuration de la grille',
    appSettings: 'Configuration de l\'application',
    accountWindow: 'Mon compte',
    bigPicture: 'Big picture',
    logout: 'Déconnexion',
  },

  /** Mode big picture : la grille en plein cadre */
  bigPicture: {
    exit: 'Revenir au mode normal',
  },

  /** Messages affichés par l'application elle-même */
  notices: {
    signOutFailed: 'Déconnexion impossible : le serveur est injoignable.',
    gridCleared: 'Grille effacée ({count} bouton supprimé). | Grille effacée ({count} boutons supprimés).',
    accountDeleted: 'Compte supprimé.',
  },

  /** Fenêtre « Configuration de l'application » */
  settings: {
    title: 'Configuration de l\'application',
    saveFailed: 'Réglage non enregistré : {reason}',
    sound: 'Son',
    soundEnabled: 'Son activé',
    volume: 'Volume',
    volumeValue: '{value} %',
    effects: 'Effets',
    effectsEnabled: 'Effets visuels (survol, animations)',
    theme: 'Thème',
    themeLight: 'Clair',
    themeDark: 'Sombre',
    language: 'Langue',
    /** « Suivre l'appareil », pour le thème comme pour la langue */
    device: 'Appareil',
  },

  /** Fenêtre « Mon compte » et ses confirmations */
  account: {
    title: 'Mon compte',
    password: 'Mot de passe',
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer le nouveau mot de passe',
    changePassword: 'Changer le mot de passe',
    passwordChanged: 'Mot de passe modifié. Les autres appareils sont déconnectés.',
    sameAsCurrent: 'Doit être différent du mot de passe actuel',
    mismatch: 'Les deux mots de passe sont différents',
    grid: 'Grille',
    gridText: 'Supprime tous les boutons et dossiers de votre grille. Votre compte est conservé.',
    clearGrid: 'Effacer la grille',
    deleteTitle: 'Supprimer le compte',
    deleteText: 'Supprime définitivement votre compte, votre grille et vos réglages.',
    deleteAccount: 'Supprimer mon compte',
  },

  /** Confirmation de l'effacement de la grille */
  clearGrid: {
    title: 'Effacer toute la grille ?',
    count: '{count} bouton supprimé, dossiers et contenus compris. | {count} boutons supprimés, dossiers et contenus compris.',
    confirm: 'Effacer la grille',
  },

  /** Confirmation de la suppression du compte */
  deleteAccount: {
    title: 'Supprimer votre compte ?',
    warning: 'Votre compte et vos réglages seront supprimés. Cette action est définitive. | Votre compte, votre bouton et vos réglages seront supprimés. Cette action est définitive. | Votre compte, vos {count} boutons et vos réglages seront supprimés. Cette action est définitive.',
    password: 'Mot de passe',
    confirm: 'Supprimer mon compte',
  },
}
