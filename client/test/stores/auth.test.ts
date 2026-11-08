import type { Credentials, User } from '@/interfaces/auth'
import type { Button } from '@/interfaces/button'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteAccount } from '@/api/account'
import { fetchMe, login, logout, register } from '@/api/auth'
import { fetchExampleButtons, importButtons } from '@/api/buttons'
import { fetchSettings, updateSettings } from '@/api/settings'
import { useAuthStore } from '@/stores/auth'
import { useButtonsStore } from '@/stores/buttons'
import { useGuestStore } from '@/stores/guest'
import { useSettingsStore } from '@/stores/settings'
import { GUEST_BUTTONS_KEY, GUEST_SETTINGS_KEY, GUEST_STORAGE_KEY } from '@/utils/guestStorage'
import { playSound } from '@/utils/sounds'
import { stubStorage } from '../helpers/storage'

vi.mock('@/api/account', () => ({ changePassword: vi.fn(), deleteAccount: vi.fn() }))
vi.mock('@/api/auth', () => ({
  fetchMe: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}))
vi.mock('@/api/settings', () => ({ fetchSettings: vi.fn(), updateSettings: vi.fn() }))
vi.mock('@/utils/sounds', () => ({ playSound: vi.fn() }))
vi.mock('@/api/buttons', () => ({
  fetchButtons: vi.fn(),
  createButton: vi.fn(),
  updateButton: vi.fn(),
  deleteButton: vi.fn(),
  moveButton: vi.fn(),
  fetchExampleButtons: vi.fn(),
  importButtons: vi.fn(),
}))

const fetchMeMock = vi.mocked(fetchMe)
const loginMock = vi.mocked(login)
const registerMock = vi.mocked(register)
const logoutMock = vi.mocked(logout)
const deleteAccountMock = vi.mocked(deleteAccount)
const fetchSettingsMock = vi.mocked(fetchSettings)

const darkSettings = { soundEnabled: false, volume: 30, effectsEnabled: false, theme: 'dark' as const, locale: 'system' as const }

const jean: User = { id: 'u1', email: 'jean@exemple.fr' }
const credentials: Credentials = { email: 'jean@exemple.fr', password: 'motdepasse' }

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    for (const mock of [fetchMeMock, loginMock, registerMock, logoutMock, deleteAccountMock, vi.mocked(playSound)]) {
      mock.mockReset()
    }
  })

  it('démarre sans personne connectée et pas prêt', () => {
    const auth = useAuthStore()
    expect(auth.user).toBeNull()
    expect(auth.ready).toBe(false)
  })

  it('restore reprend la session ouverte', async () => {
    fetchMeMock.mockResolvedValue(jean)
    const auth = useAuthStore()
    await auth.restore()
    expect(auth.user).toEqual(jean)
    expect(auth.ready).toBe(true)
  })

  it('restore sans session (ou serveur injoignable) est prêt et sans personne', async () => {
    fetchMeMock.mockRejectedValue(new Error('401'))
    const auth = useAuthStore()
    await auth.restore()
    expect(auth.user).toBeNull()
    expect(auth.ready).toBe(true)
  })

  it('signIn et signUp enregistrent la personne et transmettent le formulaire', async () => {
    loginMock.mockResolvedValue(jean)
    registerMock.mockResolvedValue(jean)
    const auth = useAuthStore()

    await auth.signIn(credentials)
    expect(loginMock).toHaveBeenCalledWith(credentials)
    expect(auth.user).toEqual(jean)

    auth.user = null
    await auth.signUp(credentials)
    expect(registerMock).toHaveBeenCalledWith(credentials)
    expect(auth.user).toEqual(jean)
  })

  it('signIn laisse remonter le refus du serveur et ne connecte personne', async () => {
    const refusal = new Error('401')
    loginMock.mockRejectedValue(refusal)
    const auth = useAuthStore()
    await expect(auth.signIn(credentials)).rejects.toBe(refusal)
    expect(auth.user).toBeNull()
  })

  it('signOut déconnecte et vide les boutons de la personne', async () => {
    loginMock.mockResolvedValue(jean)
    logoutMock.mockResolvedValue()
    const auth = useAuthStore()
    const buttons = useButtonsStore()
    await auth.signIn(credentials)
    buttons.buttons = [{ id: 'a', parentId: null, position: 0, label: 'A', icon: 'mdi-star', type: 'folder' }]
    buttons.loaded = true

    await auth.signOut()

    expect(logoutMock).toHaveBeenCalled()
    expect(auth.user).toBeNull()
    expect(buttons.buttons).toEqual([])
    expect(buttons.loaded).toBe(false)
  })

  it('signOut laisse la session ouverte quand le serveur ne répond pas', async () => {
    loginMock.mockResolvedValue(jean)
    logoutMock.mockRejectedValue(new Error('réseau'))
    const auth = useAuthStore()
    await auth.signIn(credentials)

    await expect(auth.signOut()).rejects.toThrow('réseau')
    expect(auth.user).toEqual(jean)
  })

  describe('removeAccount', () => {
    beforeEach(() => {
      fetchSettingsMock.mockResolvedValue({ ...darkSettings, soundEnabled: true })
      loginMock.mockResolvedValue(jean)
    })

    it('supprime le compte, ferme la session et remet boutons et réglages à zéro', async () => {
      deleteAccountMock.mockResolvedValue()
      const auth = useAuthStore()
      await auth.signIn(credentials)
      const buttons = useButtonsStore()
      buttons.buttons = [{ id: 'b1', parentId: null, position: 1, label: 'Un', icon: 'mdi-web', type: 'action', url: 'https://exemple.fr' }]

      await auth.removeAccount('motdepasse')

      expect(deleteAccountMock).toHaveBeenCalledWith('motdepasse')
      expect(auth.user).toBeNull()
      expect(buttons.buttons).toEqual([])
      expect(useSettingsStore().theme).toBe('system')
    })

    it('joue le son de suppression avec les réglages de la personne, avant de les remettre à zéro', async () => {
      deleteAccountMock.mockResolvedValue()
      const auth = useAuthStore()
      await auth.signIn(credentials)

      await auth.removeAccount('motdepasse')

      expect(playSound).toHaveBeenCalledWith('delete', 0.3)
    })

    it('laisse la session ouverte et muette quand le serveur refuse (mot de passe faux)', async () => {
      const refusal = new Error('403')
      deleteAccountMock.mockRejectedValue(refusal)
      const auth = useAuthStore()
      await auth.signIn(credentials)

      await expect(auth.removeAccount('mauvais')).rejects.toBe(refusal)

      expect(auth.user).toEqual(jean)
      expect(useSettingsStore().theme).toBe('dark')
      expect(playSound).not.toHaveBeenCalled()
    })
  })

  describe('réglages', () => {
    it('restore, signIn et signUp chargent les réglages du compte', async () => {
      fetchSettingsMock.mockResolvedValue(darkSettings)
      fetchMeMock.mockResolvedValue(jean)
      loginMock.mockResolvedValue(jean)
      registerMock.mockResolvedValue(jean)
      const settings = useSettingsStore()
      const auth = useAuthStore()

      await auth.restore()
      expect(settings.theme).toBe('dark')

      settings.reset()
      await auth.signIn(credentials)
      expect(settings.volume).toBe(30)

      settings.reset()
      await auth.signUp(credentials)
      expect(settings.effectsEnabled).toBe(false)
    })

    it('un échec de chargement ne bloque pas la connexion : valeurs par défaut', async () => {
      fetchSettingsMock.mockRejectedValue(new Error('500'))
      loginMock.mockResolvedValue(jean)
      const auth = useAuthStore()

      await auth.signIn(credentials)

      expect(auth.user).toEqual(jean)
      expect(useSettingsStore().theme).toBe('system')
    })

    it('restore sans session ne charge rien', async () => {
      fetchMeMock.mockRejectedValue(new Error('401'))
      await useAuthStore().restore()
      expect(fetchSettingsMock).not.toHaveBeenCalled()
    })

    it('signOut remet les réglages par défaut', async () => {
      fetchSettingsMock.mockResolvedValue(darkSettings)
      loginMock.mockResolvedValue(jean)
      logoutMock.mockResolvedValue()
      const auth = useAuthStore()
      const settings = useSettingsStore()
      await auth.signIn(credentials)
      expect(settings.theme).toBe('dark')

      await auth.signOut()

      expect(settings.theme).toBe('system')
      expect(settings.volume).toBe(100)
    })
  })

  describe('mode invité', () => {
    const fetchExampleMock = vi.mocked(fetchExampleButtons)
    const importButtonsMock = vi.mocked(importButtons)
    const updateSettingsMock = vi.mocked(updateSettings)
    const github: Button = { id: 'github', parentId: null, position: 0, label: 'GitHub', icon: 'mdi-github', type: 'action', url: 'https://github.com' }
    const guestSettings = { ...darkSettings, volume: 10 }
    let data: Map<string, string>

    // Un invité qui a déjà une grille et des réglages sur l'appareil
    function guestWithGrid () {
      data = stubStorage({
        [GUEST_STORAGE_KEY]: '1',
        [GUEST_BUTTONS_KEY]: JSON.stringify([github]),
        [GUEST_SETTINGS_KEY]: JSON.stringify(guestSettings),
      })
    }

    beforeEach(() => {
      data = stubStorage()
      for (const mock of [fetchExampleMock, importButtonsMock, updateSettingsMock, fetchSettingsMock]) {
        mock.mockReset()
      }
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('enterGuest part de la grille d\'exemple au premier passage', async () => {
      fetchExampleMock.mockResolvedValue([github])
      const auth = useAuthStore()
      await auth.enterGuest()
      expect(useGuestStore().active).toBe(true)
      expect(auth.ready).toBe(true)
      expect(JSON.parse(data.get(GUEST_BUTTONS_KEY)!)).toEqual([github])
    })

    it('enterGuest part d\'une grille vide si le serveur ne répond pas', async () => {
      fetchExampleMock.mockRejectedValue(new Error('injoignable'))
      await useAuthStore().enterGuest()
      expect(data.get(GUEST_BUTTONS_KEY)).toBe('[]')
    })

    it('enterGuest retrouve la grille laissée et ses réglages', async () => {
      guestWithGrid()
      await useAuthStore().enterGuest()
      expect(fetchExampleMock).not.toHaveBeenCalled()
      expect(useSettingsStore().volume).toBe(10)
      expect(fetchSettingsMock).not.toHaveBeenCalled()
    })

    it('restore sans session reprend l\'invité et ses réglages', async () => {
      guestWithGrid()
      fetchMeMock.mockRejectedValue(new Error('401'))
      const auth = useAuthStore()
      await auth.restore()
      expect(auth.user).toBeNull()
      expect(useGuestStore().active).toBe(true)
      expect(useSettingsStore().theme).toBe('dark')
    })

    it('leaveGuest quitte le mode invité sans effacer sa grille', async () => {
      guestWithGrid()
      const auth = useAuthStore()
      await auth.enterGuest()
      auth.leaveGuest()
      expect(useGuestStore().active).toBe(false)
      expect(data.has(GUEST_BUTTONS_KEY)).toBe(true)
      expect(useSettingsStore().volume).toBe(100)
    })

    it('signIn depuis le mode invité affiche la grille du compte et garde celle de l\'invité dans le navigateur', async () => {
      guestWithGrid()
      loginMock.mockResolvedValue(jean)
      fetchSettingsMock.mockResolvedValue(darkSettings)
      const auth = useAuthStore()
      await auth.signIn(credentials)
      expect(auth.user).toEqual(jean)
      expect(useGuestStore().active).toBe(false)
      expect(data.has(GUEST_STORAGE_KEY)).toBe(false)
      expect(data.has(GUEST_BUTTONS_KEY)).toBe(true)
      expect(importButtonsMock).not.toHaveBeenCalled()
      expect(useSettingsStore().volume).toBe(30)
    })

    it('signUp depuis le mode invité enregistre sa grille et ses réglages sur le compte', async () => {
      guestWithGrid()
      registerMock.mockResolvedValue(jean)
      importButtonsMock.mockResolvedValue([github])
      updateSettingsMock.mockResolvedValue(guestSettings)
      fetchSettingsMock.mockResolvedValue(guestSettings)
      const auth = useAuthStore()
      await auth.signUp(credentials)
      expect(importButtonsMock).toHaveBeenCalledWith([github])
      expect(updateSettingsMock).toHaveBeenCalledWith(guestSettings)
      expect(data.size).toBe(0)
      expect(auth.migrationFailed).toBe(false)
      expect(auth.user).toEqual(jean)
    })

    it('signUp sans mode invité n\'envoie rien', async () => {
      registerMock.mockResolvedValue(jean)
      fetchSettingsMock.mockResolvedValue(darkSettings)
      await useAuthStore().signUp(credentials)
      expect(importButtonsMock).not.toHaveBeenCalled()
    })

    it('un envoi qui échoue garde la grille de l\'invité, et un nouvel essai l\'envoie', async () => {
      guestWithGrid()
      registerMock.mockResolvedValue(jean)
      importButtonsMock.mockRejectedValueOnce(new Error('injoignable'))
      fetchSettingsMock.mockResolvedValue(darkSettings)
      const auth = useAuthStore()
      await auth.signUp(credentials)
      expect(auth.user).toEqual(jean)
      expect(auth.migrationFailed).toBe(true)
      expect(useGuestStore().active).toBe(false)
      expect(data.has(GUEST_BUTTONS_KEY)).toBe(true)

      importButtonsMock.mockResolvedValue([github])
      expect(await auth.retryMigration()).toBe(true)
      expect(auth.migrationFailed).toBe(false)
      expect(data.size).toBe(0)
    })
  })
})
