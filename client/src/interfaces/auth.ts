/** La personne connectée, telle que la renvoie `/api/auth` */
export interface User {
  id: string
  email: string
}

/** Ce que saisit la personne dans le formulaire de connexion ou de création de compte */
export interface Credentials {
  email: string
  password: string
  /** « Se souvenir de moi » : session de 30 jours au lieu de la durée du navigateur */
  remember: boolean
}
