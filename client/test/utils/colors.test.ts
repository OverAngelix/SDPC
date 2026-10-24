import { describe, expect, it } from 'vitest'
import { BUTTON_COLORS, colorOf, DEFAULT_COLOR } from '@/utils/colors'

describe('BUTTON_COLORS', () => {
  it('propose 10 couleurs distinctes, avec un libellé', () => {
    expect(BUTTON_COLORS).toHaveLength(10)
    expect(new Set(BUTTON_COLORS.map(color => color.value)).size).toBe(10)
    expect(BUTTON_COLORS.every(color => color.label !== '')).toBe(true)
  })

  it('contient la couleur par défaut, le gris', () => {
    expect(DEFAULT_COLOR).toBe('grey')
    expect(BUTTON_COLORS.some(color => color.value === DEFAULT_COLOR)).toBe(true)
  })
})

describe('colorOf', () => {
  it('renvoie la couleur du bouton', () => {
    expect(colorOf({ color: 'teal' })).toBe('teal')
  })

  it('renvoie le gris pour un bouton sans couleur ou un emplacement libre', () => {
    expect(colorOf({})).toBe('grey')
    expect(colorOf(null)).toBe('grey')
    expect(colorOf(undefined)).toBe('grey')
  })
})
