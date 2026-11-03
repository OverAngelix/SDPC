/** Corps de `PUT /api/account/password` */
export interface ChangePasswordBody {
  currentPassword: string
  newPassword: string
}

/** Corps de `DELETE /api/account` */
export interface DeleteAccountBody {
  password: string
}
