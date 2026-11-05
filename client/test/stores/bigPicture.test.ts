import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useBigPictureStore } from '@/stores/bigPicture'

describe('big picture store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('est inactif au départ', () => {
    expect(useBigPictureStore().active).toBe(false)
  })

  it('s\'active en entrant', () => {
    const bigPicture = useBigPictureStore()
    bigPicture.enter()
    expect(bigPicture.active).toBe(true)
  })

  it('se désactive en sortant', () => {
    const bigPicture = useBigPictureStore()
    bigPicture.enter()
    bigPicture.exit()
    expect(bigPicture.active).toBe(false)
  })

  it('sortir alors qu\'il est inactif ne change rien', () => {
    const bigPicture = useBigPictureStore()
    bigPicture.exit()
    expect(bigPicture.active).toBe(false)
  })
})
