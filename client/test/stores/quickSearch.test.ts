import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useQuickSearchStore } from '@/stores/quickSearch'

describe('quick search store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('est fermé au départ', () => {
    expect(useQuickSearchStore().open).toBe(false)
  })

  it('s\'ouvre et se referme', () => {
    const quickSearch = useQuickSearchStore()
    quickSearch.show()
    expect(quickSearch.open).toBe(true)
    quickSearch.hide()
    expect(quickSearch.open).toBe(false)
  })

  it('rouvrir une fenêtre déjà ouverte ne change rien', () => {
    const quickSearch = useQuickSearchStore()
    quickSearch.show()
    quickSearch.show()
    expect(quickSearch.open).toBe(true)
  })
})
