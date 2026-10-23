import type { Button } from '@/interfaces/button'
import { describe, expect, it } from 'vitest'
import { BACK_SLOT, buildSlots, collectSubtree, COLUMNS, ROWS, SLOTS } from '@/grid'

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
  it('fait 7 colonnes sur 5 lignes, soit 35 emplacements', () => {
    expect(COLUMNS).toBe(7)
    expect(ROWS).toBe(5)
    expect(SLOTS).toBe(35)
  })

  it('place le retour à la première case', () => {
    expect(BACK_SLOT).toBe(0)
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

  it('utilise les 35 emplacements à la racine, y compris le premier', () => {
    const first = makeButton({ id: 'first', position: BACK_SLOT })
    expect(buildSlots([first], null)[BACK_SLOT]).toBe(first)
  })

  it('réserve le premier emplacement d\'un dossier au retour', () => {
    const intruder = makeButton({ id: 'intruder', parentId: 'folder', position: BACK_SLOT })
    const next = makeButton({ id: 'next', parentId: 'folder', position: 1 })

    const slots = buildSlots([intruder, next], 'folder')

    expect(slots).toHaveLength(SLOTS)
    expect(slots[BACK_SLOT]).toBeNull()
    expect(slots[1]).toBe(next)
  })

  it('ignore un emplacement hors de la grille', () => {
    const outside = makeButton({ id: 'outside', position: SLOTS })
    const negative = makeButton({ id: 'negative', position: -1 })

    const slots = buildSlots([outside, negative], null)

    expect(slots).toHaveLength(SLOTS)
    expect(slots.every(slot => slot === null)).toBe(true)
  })
})

describe('collectSubtree', () => {
  const games = makeButton({ id: 'games', type: 'folder', url: undefined })
  const retro = makeButton({ id: 'retro', parentId: 'games', position: 1, type: 'folder', url: undefined })
  const mario = makeButton({ id: 'mario', parentId: 'retro', position: 1 })
  const zelda = makeButton({ id: 'zelda', parentId: 'games', position: 2 })
  const mail = makeButton({ id: 'mail', position: 1 })
  const all = [games, retro, mario, zelda, mail]

  it('renvoie le bouton seul quand il n\'a pas de contenu', () => {
    expect(collectSubtree(all, 'mail')).toEqual(new Set(['mail']))
  })

  it('renvoie le dossier et son contenu sur tous les niveaux', () => {
    expect(collectSubtree(all, 'games')).toEqual(new Set(['games', 'retro', 'mario', 'zelda']))
    expect(collectSubtree(all, 'retro')).toEqual(new Set(['retro', 'mario']))
  })
})
