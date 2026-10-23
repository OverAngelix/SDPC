import type { Button } from '@/api/buttons'
import { describe, expect, it } from 'vitest'
import { buildSlots, COLUMNS, ROWS, SLOTS } from './grid'

function makeButton (overrides: Partial<Button>): Button {
  return {
    id: 'b',
    parentId: null,
    position: 0,
    label: 'Bouton',
    icon: 'mdi-star',
    type: 'action',
    url: 'https://example.com',
    ...overrides,
  }
}

describe('constantes de la grille', () => {
  it('fait 5 colonnes sur 7 lignes, soit 35 emplacements', () => {
    expect(COLUMNS).toBe(5)
    expect(ROWS).toBe(7)
    expect(SLOTS).toBe(35)
  })
})

describe('buildSlots', () => {
  it('renvoie 35 emplacements vides pour un dossier sans bouton', () => {
    const slots = buildSlots([], null)
    expect(slots).toHaveLength(SLOTS)
    expect(slots.every(slot => slot === null)).toBe(true)
  })

  it('place chaque bouton à son emplacement', () => {
    const first = makeButton({ id: 'first', position: 0 })
    const last = makeButton({ id: 'last', position: 34 })
    const middle = makeButton({ id: 'middle', position: 17 })

    const slots = buildSlots([last, first, middle], null)

    expect(slots).toHaveLength(SLOTS)
    expect(slots[0]).toBe(first)
    expect(slots[17]).toBe(middle)
    expect(slots[34]).toBe(last)
    expect(slots.filter(slot => slot !== null)).toHaveLength(3)
  })

  it('ne garde que les boutons du dossier demandé', () => {
    const root = makeButton({ id: 'root', position: 1 })
    const inFolder = makeButton({ id: 'inFolder', parentId: 'folder', position: 1 })
    const other = makeButton({ id: 'other', parentId: 'elsewhere', position: 2 })
    const buttons = [root, inFolder, other]

    expect(buildSlots(buttons, null)[1]).toBe(root)
    expect(buildSlots(buttons, 'folder')[1]).toBe(inFolder)
    expect(buildSlots(buttons, 'folder')[2]).toBeNull()
  })

  it('ignore un emplacement hors de la grille', () => {
    const outside = makeButton({ id: 'outside', position: SLOTS })
    const negative = makeButton({ id: 'negative', position: -1 })

    const slots = buildSlots([outside, negative], null)

    expect(slots).toHaveLength(SLOTS)
    expect(slots.every(slot => slot === null)).toBe(true)
  })
})
