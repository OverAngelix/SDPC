// Touches 1 à 7 de la rangée du haut ou du pavé numérique. On lit la touche physique (event.code) :
// en AZERTY, la rangée du haut donne « & », « é »… sans Maj, et event.key ne vaudrait « 1 » qu'avec Maj
const SHORTCUT_CODE = /^(?:Digit|Numpad)([1-7])$/

/** Nombre de cases accessibles au clavier en big picture : les touches 1 à 7, la première ligne de la grille 7 × 4 */
export const SHORTCUT_COUNT = 7

/** Emplacement (0 à 6) déclenché par les touches 1 à 7, null pour toute autre touche, combinaison ou répétition. */
export function shortcutSlot (event: Pick<KeyboardEvent, 'code' | 'ctrlKey' | 'metaKey' | 'altKey' | 'repeat'>): number | null {
  // Ctrl+1 ou ⌘+1 change d'onglet dans le navigateur : on le lui laisse
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) {
    return null
  }
  const match = SHORTCUT_CODE.exec(event.code)
  return match ? Number(match[1]) - 1 : null
}

/** La touche vise un champ de saisie, une fenêtre ou un menu ouvert : les raccourcis de la grille l'ignorent. */
export function isTypingTarget (event: Event): boolean {
  const target = event.target instanceof Element ? event.target : null
  return target?.closest('input, textarea, select, [contenteditable], .v-overlay') != null
}

/** ⌘F ou Ctrl+F : ouvre la recherche rapide. Les deux combinaisons marchent sur tous les systèmes, seul le rappel affiché change. */
export function isQuickSearchShortcut (event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey' | 'repeat'>): boolean {
  return (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && !event.repeat && event.key.toLowerCase() === 'f'
}

/** Ce que le navigateur dit du système ; `userAgentData` n'existe que dans les navigateurs Chromium */
interface PlatformHints {
  platform?: string
  userAgentData?: { platform?: string }
}

/** Le système est un Mac (ou un iPhone, un iPad) : le rappel du raccourci montre ⌘ au lieu de Ctrl. */
export function isApplePlatform (hints: PlatformHints | undefined = globalThis.navigator as PlatformHints | undefined): boolean {
  const platform = hints?.userAgentData?.platform || hints?.platform || ''
  return /mac|iphone|ipad|ipod/i.test(platform)
}
