/** Les entrées du menu « Mon compte » */
export type AccountAction = 'grid' | 'config' | 'settings' | 'account' | 'logout'

/** Corps de `PUT /api/account/password` */
export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}
