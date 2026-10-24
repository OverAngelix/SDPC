import type { Button } from '@/interfaces/button'
import { describe, expect, it } from 'vitest'
import { BACK_SLOT, buildSlots, collectSubtree, COLUMNS, countContent, placedIds, ROWS, SLOTS } from '@/grid'

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

describe('countContent', () => {
  const games = makeButton({ id: 'games', type: 'folder', url: undefined })
  const retro = makeButton({ id: 'retro', parentId: 'games', position: 1, type: 'folder', url: undefined })
  const mario = makeButton({ id: 'mario', parentId: 'retro', position: 1 })
  const zelda = makeButton({ id: 'zelda', parentId: 'games', position: 2 })
  const empty = makeButton({ id: 'empty', position: 1, type: 'folder', url: undefined })
  const mail = makeButton({ id: 'mail', position: 2 })
  const all = [games, retro, mario, zelda, empty, mail]

  it('compte le contenu d\'un dossier sur tous les niveaux, sans le dossier lui-même', () => {
    expect(countContent(all, 'games')).toBe(3)
    expect(countContent(all, 'retro')).toBe(1)
  })

  it('renvoie 0 pour un dossier vide ou une action', () => {
    expect(countContent(all, 'empty')).toBe(0)
    expect(countContent(all, 'mail')).toBe(0)
  })
})

describe('placedIds', () => {
  const a = makeButton({ id: 'a', position: 0 })
  const b = makeButton({ id: 'b', position: 1 })
  const slots = (...buttons: Button[]) => buildSlots(buttons, null)

  it('signale un bouton créé', () => {
    expect(placedIds(slots(a), slots(a, b))).toEqual(['b'])
  })

  it('signale un bouton déplacé vers un emplacement libre', () => {
    expect(placedIds(slots(a, b), slots(a, { ...b, position: 9 }))).toEqual(['b'])
  })

  it('signale les deux boutons d\'un échange', () => {
    const swapped = slots({ ...a, position: 1 }, { ...b, position: 0 })
    expect(placedIds(slots(a, b), swapped)).toEqual(['b', 'a'])
  })

  it('ne signale rien quand rien ne bouge, ni après une suppression ou une modification', () => {
    expect(placedIds(slots(a, b), slots(a, b))).toEqual([])
    expect(placedIds(slots(a, b), slots(a))).toEqual([])
    expect(placedIds(slots(a, b), slots({ ...a, label: 'Autre' }, b))).toEqual([])
  })

  it('ne signale rien au premier remplissage d\'une grille vide', () => {
    expect(placedIds(slots(), slots(a, b))).toEqual([])
  })
})
