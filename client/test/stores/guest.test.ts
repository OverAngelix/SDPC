import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGuestStore } from '@/stores/guest'
import { GUEST_BUTTONS_KEY, GUEST_STORAGE_KEY } from '@/utils/guestStorage'
import { stubStorage } from '../helpers/storage'

describe('guest store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reprend le mode invité retenu sur l\'appareil', () => {
    stubStorage({ [GUEST_STORAGE_KEY]: '1' })
    expect(useGuestStore().active).toBe(true)
  })

  it('entre puis quitte le mode invité en gardant la grille', () => {
    const data = stubStorage({ [GUEST_BUTTONS_KEY]: '[]' })
    const guest = useGuestStore()
    guest.enter()
    expect(guest.active).toBe(true)
    expect(data.get(GUEST_STORAGE_KEY)).toBe('1')

    guest.leave()
    expect(guest.active).toBe(false)
    expect(data.has(GUEST_STORAGE_KEY)).toBe(false)
    expect(data.get(GUEST_BUTTONS_KEY)).toBe('[]')
  })

  it('discard quitte le mode invité et efface sa grille', () => {
    const data = stubStorage({ [GUEST_STORAGE_KEY]: '1', [GUEST_BUTTONS_KEY]: '[]' })
    const guest = useGuestStore()
    guest.discard()
    expect(guest.active).toBe(false)
    expect(data.size).toBe(0)
  })
})
