/** Forme des erreurs renvoyées par le serveur (voir la fiche 02) */
export interface ApiErrorBody {
  error: string
  details?: string[]
}

/** Une erreur prête à être affichée : un titre et, si le serveur en donne, le détail */
export interface ApiErrorMessage {
  title: string
  details: string[]
}
