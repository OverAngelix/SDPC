import type { Credentials, User } from '@/interfaces/auth'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchMe, login, logout, register } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useButtonsStore } from '@/stores/buttons'

vi.mock('@/api/auth', () => ({
  fetchMe: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}))
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

const jean: User = { id: 'u1', email: 'jean@exemple.fr' }
const credentials: Credentials = { email: 'jean@exemple.fr', password: 'motdepasse', remember: true }

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    for (const mock of [fetchMeMock, loginMock, registerMock, logoutMock]) {
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
})
