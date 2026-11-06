export const BIG_PICTURE_STORAGE_KEY = 'sdpc.bigPicture'

// Le stockage du navigateur peut être absent ou refusé (navigation privée) : le mode n'est alors pas retenu
/** Le big picture était-il actif sur cet appareil ? */
export function readRememberedBigPicture (): boolean {
  try {
    return localStorage.getItem(BIG_PICTURE_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/** Retient que le big picture est actif sur cet appareil, ou l'oublie. */
export function writeRememberedBigPicture (active: boolean) {
  try {
    if (active) {
      localStorage.setItem(BIG_PICTURE_STORAGE_KEY, '1')
    } else {
      localStorage.removeItem(BIG_PICTURE_STORAGE_KEY)
    }
  } catch {
    // Le mode ne sera pas retenu, la grille elle-même n'est pas touchée
  }
}
