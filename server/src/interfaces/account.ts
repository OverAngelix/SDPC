/** Corps de `PUT /api/account/password` */
export interface ChangePasswordBody {
  currentPassword: string
  newPassword: string
}

/** Corps de `DELETE /api/account` */
export interface DeleteAccountBody {
  password: string
}

// Plus tard connexion avec le compte Google, Facebook, etc. pour la création de compte et la connexion
