/** Les entrées du menu « Mon compte » ; `clear`, `register`, `login` et `leaveGuest` sont celles du mode invité */
export type AccountAction = 'grid' | 'config' | 'settings' | 'account' | 'bigPicture' | 'logout' | 'clear' | 'register' | 'login' | 'leaveGuest'

/** Corps de `PUT /api/account/password` */
export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}
