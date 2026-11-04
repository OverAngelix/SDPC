/** Forme des erreurs renvoyées par le serveur (voir la fiche 02) */
export interface ApiErrorBody {
  /** Texte français du serveur : le repli quand le client ne connaît pas le code */
  error: string
  /** Code stable de l'erreur, que le client traduit (`errors.<code>`) */
  code?: string
  /** Texte français de chaque problème, « champ : message » */
  details?: string[]
  /** Les mêmes problèmes sous forme de codes (`issues.<code>`) et de paramètres */
  issues?: ApiIssue[]
}

/** Un problème relevé sur un champ de la requête */
export interface ApiIssue {
  field?: string
  code: string
  params?: Record<string, string | number>
}

/** Une erreur prête à être affichée : un titre et, si le serveur en donne, le détail */
export interface ApiErrorMessage {
  title: string
  details: string[]
}
