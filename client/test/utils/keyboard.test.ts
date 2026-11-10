import { describe, expect, it } from 'vitest'
import { isApplePlatform, isQuickSearchShortcut, shortcutSlot } from '@/utils/keyboard'

function key (code: string, modifiers: Partial<Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'altKey' | 'repeat'>> = {}) {
  return { code, ctrlKey: false, metaKey: false, altKey: false, repeat: false, ...modifiers }
}

describe('shortcutSlot', () => {
  it('donne l\'emplacement 0 à 6 pour les touches 1 à 7 de la rangée du haut', () => {
    expect(shortcutSlot(key('Digit1'))).toBe(0)
    expect(shortcutSlot(key('Digit5'))).toBe(4)
    expect(shortcutSlot(key('Digit7'))).toBe(6)
  })

  it('accepte le pavé numérique', () => {
    expect(shortcutSlot(key('Numpad1'))).toBe(0)
    expect(shortcutSlot(key('Numpad7'))).toBe(6)
  })

  it('ignore les touches hors plage', () => {
    expect(shortcutSlot(key('Digit0'))).toBeNull()
    expect(shortcutSlot(key('Numpad0'))).toBeNull()
    expect(shortcutSlot(key('Digit8'))).toBeNull()
    expect(shortcutSlot(key('Numpad9'))).toBeNull()
    expect(shortcutSlot(key('KeyF'))).toBeNull()
    expect(shortcutSlot(key('NumpadEnter'))).toBeNull()
  })

  it('laisse les combinaisons au navigateur', () => {
    expect(shortcutSlot(key('Digit1', { ctrlKey: true }))).toBeNull()
    expect(shortcutSlot(key('Digit1', { metaKey: true }))).toBeNull()
    expect(shortcutSlot(key('Digit1', { altKey: true }))).toBeNull()
  })

  it('ignore la répétition d\'une touche maintenue', () => {
    expect(shortcutSlot(key('Digit1', { repeat: true }))).toBeNull()
  })
})

function combo (keyName: string, modifiers: Partial<Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey' | 'repeat'>> = {}) {
  return { key: keyName, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, repeat: false, ...modifiers }
}

describe('isQuickSearchShortcut', () => {
  it('reconnaît ⌘F et Ctrl+F', () => {
    expect(isQuickSearchShortcut(combo('f', { metaKey: true }))).toBe(true)
    expect(isQuickSearchShortcut(combo('f', { ctrlKey: true }))).toBe(true)
  })

  it('accepte la lettre en majuscule (verrouillage des majuscules)', () => {
    expect(isQuickSearchShortcut(combo('F', { ctrlKey: true }))).toBe(true)
  })

  it('ignore F seul, avec Alt ou Maj, et la répétition', () => {
    expect(isQuickSearchShortcut(combo('f'))).toBe(false)
    expect(isQuickSearchShortcut(combo('f', { metaKey: true, altKey: true }))).toBe(false)
    expect(isQuickSearchShortcut(combo('f', { ctrlKey: true, shiftKey: true }))).toBe(false)
    expect(isQuickSearchShortcut(combo('f', { metaKey: true, repeat: true }))).toBe(false)
  })

  it('ignore une autre lettre', () => {
    expect(isQuickSearchShortcut(combo('k', { metaKey: true }))).toBe(false)
  })
})

describe('isApplePlatform', () => {
  it('reconnaît un Mac, un iPhone et un iPad', () => {
    expect(isApplePlatform({ platform: 'MacIntel' })).toBe(true)
    expect(isApplePlatform({ platform: 'iPhone' })).toBe(true)
    expect(isApplePlatform({ platform: 'iPad' })).toBe(true)
  })

  it('préfère userAgentData quand le navigateur le fournit', () => {
    expect(isApplePlatform({ platform: 'Win32', userAgentData: { platform: 'macOS' } })).toBe(true)
    expect(isApplePlatform({ platform: 'MacIntel', userAgentData: { platform: 'Windows' } })).toBe(false)
  })

  it('renvoie faux pour Windows, Linux, ou un système inconnu', () => {
    expect(isApplePlatform({ platform: 'Win32' })).toBe(false)
    expect(isApplePlatform({ platform: 'Linux x86_64' })).toBe(false)
    expect(isApplePlatform({})).toBe(false)
  })
})
