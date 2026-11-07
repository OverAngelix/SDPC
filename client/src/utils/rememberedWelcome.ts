export const WELCOME_STORAGE_KEY = 'sdpc.welcomeSeen'

// Le stockage du navigateur peut être absent ou refusé (navigation privée) : l'écran n'est alors pas retenu
/** L'écran de bienvenue a-t-il déjà été vu sur cet appareil ? */
export function readWelcomeSeen (): boolean {
  try {
    return localStorage.getItem(WELCOME_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/** Retient que l'écran de bienvenue a été vu sur cet appareil. */
export function writeWelcomeSeen () {
  try {
    localStorage.setItem(WELCOME_STORAGE_KEY, '1')
  } catch {
    // L'écran reviendra à la prochaine ouverture de l'application, rien d'autre n'est touché
  }
}
