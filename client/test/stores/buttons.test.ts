import type { Button } from '@/interfaces/button'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchButtons } from '@/api/buttons'
import { SLOTS } from '@/grid'
import { useButtonsStore } from '@/stores/buttons'

vi.mock('@/api/buttons', () => ({ fetchButtons: vi.fn() }))

const fetchButtonsMock = vi.mocked(fetchButtons)

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

const games = makeButton({ id: 'games', position: 0, type: 'folder', url: undefined })
const retro = makeButton({ id: 'retro', parentId: 'games', position: 3, type: 'folder', url: undefined })
const mario = makeButton({ id: 'mario', parentId: 'retro', position: 1 })
const mail = makeButton({ id: 'mail', position: 4 })

describe('buttons store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    fetchButtonsMock.mockReset()
  })

  it('démarre vide, sans chargement ni erreur', () => {
    const store = useButtonsStore()
    expect(store.buttons).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBe(false)
    expect(store.loaded).toBe(false)
  })

  it('charge les boutons du serveur', async () => {
    fetchButtonsMock.mockResolvedValue([games, mail])
    const store = useButtonsStore()

    await store.load()

    expect(store.buttons).toEqual([games, mail])
    expect(store.loaded).toBe(true)
    expect(store.error).toBe(false)
    expect(store.loading).toBe(false)
  })

  it('indique le chargement en cours', async () => {
    fetchButtonsMock.mockResolvedValue([])
    const store = useButtonsStore()

    const promise = store.load()
    expect(store.loading).toBe(true)
    await promise
    expect(store.loading).toBe(false)
  })

  it('signale une erreur quand le serveur est injoignable', async () => {
    fetchButtonsMock.mockRejectedValue(new Error('Network Error'))
    const store = useButtonsStore()

    await store.load()

    expect(store.error).toBe(true)
    expect(store.loaded).toBe(false)
    expect(store.loading).toBe(false)
  })

  it('efface l\'erreur au rechargement réussi', async () => {
    fetchButtonsMock.mockRejectedValueOnce(new Error('Network Error'))
    const store = useButtonsStore()
    await store.load()
    expect(store.error).toBe(true)

    fetchButtonsMock.mockResolvedValueOnce([mail])
    await store.load()

    expect(store.error).toBe(false)
    expect(store.loaded).toBe(true)
    expect(store.buttons).toEqual([mail])
  })

  it('garde les boutons déjà chargés quand un rechargement échoue', async () => {
    fetchButtonsMock.mockResolvedValueOnce([mail])
    const store = useButtonsStore()
    await store.load()

    fetchButtonsMock.mockRejectedValueOnce(new Error('Network Error'))
    await store.load()

    expect(store.error).toBe(true)
    expect(store.buttons).toEqual([mail])
  })

  describe('slotsOf', () => {
    it('range les boutons de la racine et d\'un dossier', async () => {
      fetchButtonsMock.mockResolvedValue([games, retro, mario, mail])
      const store = useButtonsStore()
      await store.load()

      const root = store.slotsOf(null)
      expect(root).toHaveLength(SLOTS)
      expect(root[0]).toEqual(games)
      expect(root[4]).toEqual(mail)

      const inRetro = store.slotsOf('retro')
      expect(inRetro).toHaveLength(SLOTS)
      expect(inRetro[1]).toEqual(mario)
      expect(inRetro.filter(slot => slot !== null)).toHaveLength(1)
    })

    it('renvoie une grille vide pour un dossier sans contenu', async () => {
      fetchButtonsMock.mockResolvedValue([games])
      const store = useButtonsStore()
      await store.load()

      expect(store.slotsOf('games').every(slot => slot === null)).toBe(true)
    })
  })

  describe('pathTo', () => {
    it('renvoie les dossiers de la racine jusqu\'au dossier demandé', async () => {
      fetchButtonsMock.mockResolvedValue([games, retro, mario, mail])
      const store = useButtonsStore()
      await store.load()

      expect(store.pathTo('games')?.map(folder => folder.id)).toEqual(['games'])
      expect(store.pathTo('retro')?.map(folder => folder.id)).toEqual(['games', 'retro'])
    })

    it('renvoie null pour un identifiant inconnu', async () => {
      fetchButtonsMock.mockResolvedValue([games])
      const store = useButtonsStore()
      await store.load()

      expect(store.pathTo('absent')).toBeNull()
    })

    it('renvoie null pour une action', async () => {
      fetchButtonsMock.mockResolvedValue([games, mail])
      const store = useButtonsStore()
      await store.load()

      expect(store.pathTo('mail')).toBeNull()
    })

    it('renvoie null quand la chaîne des parents est rompue', async () => {
      fetchButtonsMock.mockResolvedValue([retro])
      const store = useButtonsStore()
      await store.load()

      expect(store.pathTo('retro')).toBeNull()
    })

    it('ne boucle pas sur des parents cycliques', async () => {
      const a = makeButton({ id: 'a', parentId: 'b', type: 'folder', url: undefined })
      const b = makeButton({ id: 'b', parentId: 'a', type: 'folder', url: undefined })
      fetchButtonsMock.mockResolvedValue([a, b])
      const store = useButtonsStore()
      await store.load()

      expect(store.pathTo('a')).toBeNull()
    })
  })
})
