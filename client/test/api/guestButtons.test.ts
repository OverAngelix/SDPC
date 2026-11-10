import type { Button } from '@/interfaces/button'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchExampleButtons } from '@/api/buttons'
import { clearButtons, createButton, deleteButton, fetchButtons, moveButton, updateButton } from '@/api/guestButtons'
import { i18n } from '@/plugins/i18n'
import { describeApiError } from '@/utils/apiError'
import { readGuestButtons, writeGuestButtons } from '@/utils/guestStorage'
import { stubStorage } from '../helpers/storage'

vi.mock('@/api/buttons', () => ({ fetchExampleButtons: vi.fn() }))

const fetchExampleMock = vi.mocked(fetchExampleButtons)

const games: Button = { id: 'games', parentId: null, position: 0, label: 'Jeux', icon: 'mdi-folder', type: 'folder' }
const retro: Button = { id: 'retro', parentId: 'games', position: 2, label: 'Rétro', icon: 'mdi-folder', type: 'folder' }
const mario: Button = { id: 'mario', parentId: 'retro', position: 1, label: 'Mario', icon: 'mdi-star', type: 'action', url: 'https://mario.example' }
const mail: Button = { id: 'mail', parentId: null, position: 4, label: 'Mail', icon: 'mdi-email', type: 'action', url: 'https://mail.example' }

/** Le statut et le code de l'erreur levée, comme les lirait le reste de l'application */
async function refusal (promise: Promise<unknown>) {
  const error = await promise.then(() => undefined, (error_: unknown) => error_) as { response?: { status: number, data: { code: string } } }
  return { status: error?.response?.status, code: error?.response?.data.code }
}

describe('guestButtons', () => {
  beforeEach(() => {
    stubStorage()
    writeGuestButtons([games, retro, mario, mail])
    fetchExampleMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('liste la grille de l\'invité', async () => {
    expect(await fetchButtons()).toEqual([games, retro, mario, mail])
    expect(fetchExampleMock).not.toHaveBeenCalled()
  })

  it('garde une grille vidée par l\'invité, sans redemander l\'exemple', async () => {
    writeGuestButtons([])
    expect(await fetchButtons()).toEqual([])
    expect(fetchExampleMock).not.toHaveBeenCalled()
  })

  it('part de la grille d\'exemple quand l\'invité n\'en a pas encore', async () => {
    stubStorage()
    fetchExampleMock.mockResolvedValue([mail])
    expect(await fetchButtons()).toEqual([mail])
    expect(readGuestButtons()).toEqual([mail])
  })

  it('serveur injoignable : grille vide pour cette fois, l\'exemple est redemandé ensuite', async () => {
    stubStorage()
    fetchExampleMock.mockRejectedValue(new Error('injoignable'))
    expect(await fetchButtons()).toEqual([])
    expect(readGuestButtons()).toBeNull()
    fetchExampleMock.mockResolvedValue([mail])
    expect(await fetchButtons()).toEqual([mail])
  })

  it('crée un bouton avec un nouvel identifiant et le garde', async () => {
    const created = await createButton({ parentId: 'games', position: 5, label: 'Zelda', icon: 'mdi-sword', type: 'action', url: 'https://zelda.example' })
    expect(created.id).not.toBe('')
    expect(readGuestButtons()).toContainEqual(created)
  })

  it('refuse comme le serveur un emplacement pris, réservé ou un dossier inconnu', async () => {
    expect(await refusal(createButton({ ...mail, position: 0 }))).toEqual({ status: 409, code: 'slot_taken' })
    expect(await refusal(createButton({ ...mail, parentId: 'games', position: 0 }))).toEqual({ status: 400, code: 'invalid_data' })
    expect(await refusal(createButton({ ...mail, parentId: 'mail', position: 3 }))).toEqual({ status: 400, code: 'invalid_data' })
    expect(readGuestButtons()).toHaveLength(4)
  })

  it('donne des erreurs que l\'application traduit comme celles du serveur', async () => {
    const error = await createButton({ ...mail, position: 0 }).catch((error_: unknown) => error_)
    const { t } = i18n.global
    expect(describeApiError(error)).toEqual({
      title: t('errors.slot_taken'),
      details: [t('errors.field', { field: 'position', message: t('issues.slot_taken', { position: 0 }) })],
    })
  })

  it('modifie un bouton ; un dossier n\'a pas d\'URL', async () => {
    expect(await updateButton('mail', { label: 'Courrier', type: 'folder' })).toEqual({ ...mail, label: 'Courrier', type: 'folder', url: undefined })
    expect(readGuestButtons()?.find(button => button.id === 'mail')?.url).toBeUndefined()
  })

  it('refuse de changer un dossier non vide en action, et un bouton inconnu', async () => {
    expect(await refusal(updateButton('games', { type: 'action', url: 'https://x.example' }))).toEqual({ status: 409, code: 'folder_not_empty' })
    expect(await refusal(updateButton('fantome', { label: 'x' }))).toEqual({ status: 404, code: 'button_not_found' })
  })

  it('déplace un bouton, ou l\'échange avec celui qui occupe la place', async () => {
    expect(await moveButton('mail', 7)).toEqual([{ ...mail, position: 7 }])
    expect(await moveButton('mail', 0)).toEqual([{ ...mail, position: 0 }, { ...games, position: 7 }])
    expect(await moveButton('mail', 0)).toEqual([])
    expect(await refusal(moveButton('mario', 0))).toEqual({ status: 400, code: 'invalid_data' })
  })

  it('supprime un dossier avec tout son contenu', async () => {
    await deleteButton('games')
    expect(readGuestButtons()).toEqual([mail])
  })

  it('efface toute la grille', async () => {
    await clearButtons()
    expect(readGuestButtons()).toEqual([])
  })
})
