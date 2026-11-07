import { afterEach, describe, expect, it, vi } from 'vitest'
import { readWelcomeSeen, WELCOME_STORAGE_KEY, writeWelcomeSeen } from '@/utils/rememberedWelcome'

function stubStorage (initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
  })
  return data
}

describe('rememberedWelcome', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('n\'est pas vu au départ', () => {
    stubStorage()
    expect(readWelcomeSeen()).toBe(false)
  })

  it('retient puis relit l\'écran vu', () => {
    const data = stubStorage()
    writeWelcomeSeen()
    expect(data.get(WELCOME_STORAGE_KEY)).toBe('1')
    expect(readWelcomeSeen()).toBe(true)
  })

  it('ignore une valeur inconnue', () => {
    stubStorage({ [WELCOME_STORAGE_KEY]: 'oui' })
    expect(readWelcomeSeen()).toBe(false)
  })

  it('ne casse pas quand le stockage est refusé', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('refusé')
      },
      setItem: () => {
        throw new Error('refusé')
      },
    })
    expect(readWelcomeSeen()).toBe(false)
    expect(() => writeWelcomeSeen()).not.toThrow()
  })
})
