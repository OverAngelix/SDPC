import { describe, expect, it } from 'vitest'
import { shortcutSlot } from '@/utils/keyboard'

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
