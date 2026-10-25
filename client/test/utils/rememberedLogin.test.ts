import { afterEach, describe, expect, it, vi } from 'vitest'
import { LOGIN_STORAGE_KEY, readRememberedLogin, writeRememberedLogin } from '@/utils/rememberedLogin'

function stubStorage (initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
    removeItem: (key: string) => {
      data.delete(key)
    },
  })
  return data
}

describe('rememberedLogin', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('ne retient rien au départ', () => {
    stubStorage()
    expect(readRememberedLogin()).toBeNull()
  })

  it('retient puis relit l\'adresse', () => {
    const data = stubStorage()
    writeRememberedLogin('jean@exemple.fr')
    expect(data.get(LOGIN_STORAGE_KEY)).toBe('jean@exemple.fr')
    expect(readRememberedLogin()).toBe('jean@exemple.fr')
  })

  it('oublie l\'adresse avec null', () => {
    const data = stubStorage({ [LOGIN_STORAGE_KEY]: 'jean@exemple.fr' })
    writeRememberedLogin(null)
    expect(data.has(LOGIN_STORAGE_KEY)).toBe(false)
    expect(readRememberedLogin()).toBeNull()
  })

  it('traite une valeur vide comme rien', () => {
    stubStorage({ [LOGIN_STORAGE_KEY]: '' })
    expect(readRememberedLogin()).toBeNull()
  })

  it('reste silencieux quand le stockage est refusé ou absent', () => {
    // En environnement de test sans stockage : localStorage n'existe pas, comme dans certains modes privés
    expect(readRememberedLogin()).toBeNull()
    expect(() => writeRememberedLogin('jean@exemple.fr')).not.toThrow()
    expect(() => writeRememberedLogin(null)).not.toThrow()
  })
})
