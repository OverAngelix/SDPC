import type { Credentials, User } from '@/interfaces/auth'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteAccount } from '@/api/account'
import { fetchMe, login, logout, register } from '@/api/auth'
import { fetchSettings } from '@/api/settings'
import { useAuthStore } from '@/stores/auth'
import { useButtonsStore } from '@/stores/buttons'
import { useSettingsStore } from '@/stores/settings'
import { playSound } from '@/utils/sounds'

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
}))

const fetchMeMock = vi.mocked(fetchMe)
const loginMock = vi.mocked(login)
const registerMock = vi.mocked(register)
const logoutMock = vi.mocked(logout)
const deleteAccountMock = vi.mocked(deleteAccount)
const fetchSettingsMock = vi.mocked(fetchSettings)

const darkSettings = { soundEnabled: false, volume: 30, effectsEnabled: false, theme: 'dark' as const }

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
})
