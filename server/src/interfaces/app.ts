import type { AuthStore } from '../auth/store.js'
import type { LoginLimiter } from '../auth/loginLimiter.js'
import type { ButtonStore } from '../buttons/store.js'
import type { SettingsStore } from '../settings/store.js'

export interface AppOptions {
  store: ButtonStore
  auth: AuthStore
  settings: SettingsStore
  limiter?: LoginLimiter
  /** Cookie de session réservé au HTTPS (production) */
  secureCookie?: boolean
  /** Origine du client si elle diffère de celle du serveur ; sinon aucun accès d'une autre origine */
  clientOrigin?: string
}
