import type { Button } from '@/interfaces/button'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createButton, deleteButton, fetchButtons, moveButton, updateButton } from '@/api/buttons'
import { SLOTS } from '@/grid'
import { useButtonsStore } from '@/stores/buttons'

vi.mock('@/api/buttons', () => ({
  fetchButtons: vi.fn(),
  createButton: vi.fn(),
  updateButton: vi.fn(),
  deleteButton: vi.fn(),
  moveButton: vi.fn(),
}))

const fetchButtonsMock = vi.mocked(fetchButtons)
const createButtonMock = vi.mocked(createButton)
const updateButtonMock = vi.mocked(updateButton)
const deleteButtonMock = vi.mocked(deleteButton)
const moveButtonMock = vi.mocked(moveButton)

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
    createButtonMock.mockReset()
    updateButtonMock.mockReset()
    deleteButtonMock.mockReset()
    moveButtonMock.mockReset()
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

  describe('create', () => {
    it('envoie le bouton au serveur et l\'ajoute à la liste', async () => {
      fetchButtonsMock.mockResolvedValue([games])
      const store = useButtonsStore()
      await store.load()
      const { id: _id, ...input } = mail
      createButtonMock.mockResolvedValue(mail)

      const created = await store.create(input)

      expect(createButtonMock).toHaveBeenCalledWith(input)
      expect(created).toEqual(mail)
      expect(store.buttons).toEqual([games, mail])
      expect(store.slotsOf(null)[4]).toEqual(mail)
    })

    it('laisse la liste intacte et relance l\'erreur du serveur', async () => {
      fetchButtonsMock.mockResolvedValue([games])
      const store = useButtonsStore()
      await store.load()
      const failure = new Error('Request failed with status code 409')
      createButtonMock.mockRejectedValue(failure)

      await expect(store.create({ parentId: null, position: 0, label: 'X', icon: 'mdi-star', type: 'folder' })).rejects.toBe(failure)
      expect(store.buttons).toEqual([games])
    })
  })

  describe('update', () => {
    it('remplace le bouton par la réponse du serveur', async () => {
      fetchButtonsMock.mockResolvedValue([games, mail])
      const store = useButtonsStore()
      await store.load()
      const renamed = { ...mail, label: 'Courrier' }
      updateButtonMock.mockResolvedValue(renamed)

      await store.update('mail', { label: 'Courrier' })

      expect(updateButtonMock).toHaveBeenCalledWith('mail', { label: 'Courrier' })
      expect(store.buttons).toEqual([games, renamed])
    })

    it('laisse la liste intacte quand le serveur refuse', async () => {
      fetchButtonsMock.mockResolvedValue([games, mail])
      const store = useButtonsStore()
      await store.load()
      updateButtonMock.mockRejectedValue(new Error('Request failed with status code 400'))

      await expect(store.update('mail', { label: '' })).rejects.toThrow()
      expect(store.buttons).toEqual([games, mail])
    })
  })

  describe('remove', () => {
    it('retire le bouton de la liste', async () => {
      fetchButtonsMock.mockResolvedValue([games, mail])
      const store = useButtonsStore()
      await store.load()
      deleteButtonMock.mockResolvedValue()

      await store.remove('mail')

      expect(deleteButtonMock).toHaveBeenCalledWith('mail')
      expect(store.buttons).toEqual([games])
    })

    it('retire aussi tout le contenu d\'un dossier', async () => {
      fetchButtonsMock.mockResolvedValue([games, retro, mario, mail])
      const store = useButtonsStore()
      await store.load()
      deleteButtonMock.mockResolvedValue()

      await store.remove('games')

      expect(store.buttons).toEqual([mail])
    })

    it('garde le bouton quand le serveur refuse', async () => {
      fetchButtonsMock.mockResolvedValue([mail])
      const store = useButtonsStore()
      await store.load()
      deleteButtonMock.mockRejectedValue(new Error('Network Error'))

      await expect(store.remove('mail')).rejects.toThrow()
      expect(store.buttons).toEqual([mail])
    })
  })

  describe('move', () => {
    it('déplace un bouton vers un emplacement libre', async () => {
      fetchButtonsMock.mockResolvedValue([games, mail])
      const store = useButtonsStore()
      await store.load()
      const moved = { ...mail, position: 9 }
      moveButtonMock.mockResolvedValue([moved])

      await store.move('mail', 9)

      expect(moveButtonMock).toHaveBeenCalledWith('mail', 9)
      expect(store.buttons).toEqual([games, moved])
      expect(store.slotsOf(null)[9]).toEqual(moved)
      expect(store.slotsOf(null)[4]).toBeNull()
    })

    it('échange deux boutons avec la réponse du serveur', async () => {
      fetchButtonsMock.mockResolvedValue([games, mail])
      const store = useButtonsStore()
      await store.load()
      const movedMail = { ...mail, position: 0 }
      const movedGames = { ...games, position: 4 }
      moveButtonMock.mockResolvedValue([movedMail, movedGames])

      await store.move('mail', 0)

      expect(store.buttons).toEqual([movedGames, movedMail])
      expect(store.slotsOf(null)[0]).toEqual(movedMail)
      expect(store.slotsOf(null)[4]).toEqual(movedGames)
    })

    it('ne change rien quand le serveur n\'a rien déplacé', async () => {
      fetchButtonsMock.mockResolvedValue([games, mail])
      const store = useButtonsStore()
      await store.load()
      moveButtonMock.mockResolvedValue([])

      await store.move('mail', 4)

      expect(store.buttons).toEqual([games, mail])
    })

    it('laisse la liste intacte et relance l\'erreur quand le serveur refuse', async () => {
      fetchButtonsMock.mockResolvedValue([games, mail])
      const store = useButtonsStore()
      await store.load()
      const failure = new Error('Request failed with status code 400')
      moveButtonMock.mockRejectedValue(failure)

      await expect(store.move('mail', 99)).rejects.toBe(failure)
      expect(store.buttons).toEqual([games, mail])
    })
  })
})
