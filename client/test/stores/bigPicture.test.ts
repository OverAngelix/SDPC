import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useBigPictureStore } from '@/stores/bigPicture'
import { BIG_PICTURE_STORAGE_KEY } from '@/utils/rememberedBigPicture'

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

describe('big picture store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('est inactif au départ', () => {
    stubStorage()
    expect(useBigPictureStore().active).toBe(false)
  })

  it('s\'active en entrant', () => {
    stubStorage()
    const bigPicture = useBigPictureStore()
    bigPicture.enter()
    expect(bigPicture.active).toBe(true)
  })

  it('se désactive en sortant', () => {
    stubStorage()
    const bigPicture = useBigPictureStore()
    bigPicture.enter()
    bigPicture.exit()
    expect(bigPicture.active).toBe(false)
  })

  it('sortir alors qu\'il est inactif ne change rien', () => {
    stubStorage()
    const bigPicture = useBigPictureStore()
    bigPicture.exit()
    expect(bigPicture.active).toBe(false)
  })

  it('bascule entre actif et inactif', () => {
    stubStorage()
    const bigPicture = useBigPictureStore()
    bigPicture.toggle()
    expect(bigPicture.active).toBe(true)
    bigPicture.toggle()
    expect(bigPicture.active).toBe(false)
  })

  it('retient le mode sur l\'appareil', () => {
    const data = stubStorage()
    const bigPicture = useBigPictureStore()
    bigPicture.enter()
    expect(data.get(BIG_PICTURE_STORAGE_KEY)).toBe('1')
    bigPicture.exit()
    expect(data.has(BIG_PICTURE_STORAGE_KEY)).toBe(false)
  })

  it('retrouve le mode après un rechargement', () => {
    stubStorage({ [BIG_PICTURE_STORAGE_KEY]: '1' })
    expect(useBigPictureStore().active).toBe(true)
  })
})
