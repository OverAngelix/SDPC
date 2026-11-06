import { afterEach, describe, expect, it, vi } from 'vitest'
import { BIG_PICTURE_STORAGE_KEY, readRememberedBigPicture, writeRememberedBigPicture } from '@/utils/rememberedBigPicture'

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

describe('rememberedBigPicture', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('n\'est pas actif au départ', () => {
    stubStorage()
    expect(readRememberedBigPicture()).toBe(false)
  })

  it('retient puis relit l\'état actif', () => {
    const data = stubStorage()
    writeRememberedBigPicture(true)
    expect(data.get(BIG_PICTURE_STORAGE_KEY)).toBe('1')
    expect(readRememberedBigPicture()).toBe(true)
  })

  it('oublie l\'état en le désactivant', () => {
    const data = stubStorage({ [BIG_PICTURE_STORAGE_KEY]: '1' })
    writeRememberedBigPicture(false)
    expect(data.has(BIG_PICTURE_STORAGE_KEY)).toBe(false)
    expect(readRememberedBigPicture()).toBe(false)
  })

  it('ignore une valeur inconnue', () => {
    stubStorage({ [BIG_PICTURE_STORAGE_KEY]: 'oui' })
    expect(readRememberedBigPicture()).toBe(false)
  })

  it('ne casse pas quand le stockage est refusé', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('refusé')
      },
      setItem: () => {
        throw new Error('refusé')
      },
      removeItem: () => {
        throw new Error('refusé')
      },
    })
    expect(readRememberedBigPicture()).toBe(false)
    expect(() => writeRememberedBigPicture(true)).not.toThrow()
  })
})
