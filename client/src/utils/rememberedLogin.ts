export const LOGIN_STORAGE_KEY = 'sdpc.login'

// Le stockage du navigateur peut être absent ou refusé (navigation privée) : rien n'est alors retenu
/** L'adresse e-mail mémorisée sur cet appareil, ou null. Jamais le mot de passe. */
export function readRememberedLogin (): string | null {
  try {
    const email = localStorage.getItem(LOGIN_STORAGE_KEY)
    return email === null || email === '' ? null : email
  } catch {
    return null
  }
}

/** Mémorise l'adresse e-mail, ou l'oublie si `email` est null. */
export function writeRememberedLogin (email: string | null) {
  try {
    if (email === null) {
      localStorage.removeItem(LOGIN_STORAGE_KEY)
    } else {
      localStorage.setItem(LOGIN_STORAGE_KEY, email)
    }
  } catch {
    // L'adresse ne sera pas retenue, la connexion elle-même n'est pas touchée
  }
}
