import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SOUND_STORAGE_KEY, useSettingsStore } from '@/stores/settings'
import { playSound } from '@/utils/sounds'

vi.mock('@/utils/sounds', () => ({ playSound: vi.fn() }))

const playSoundMock = vi.mocked(playSound)

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

describe('settings store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    playSoundMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('active le son par défaut', () => {
    stubStorage()
    expect(useSettingsStore().soundEnabled).toBe(true)
  })

  it('relit la préférence mémorisée', () => {
    stubStorage({ [SOUND_STORAGE_KEY]: 'off' })
    expect(useSettingsStore().soundEnabled).toBe(false)
    setActivePinia(createPinia())
    stubStorage({ [SOUND_STORAGE_KEY]: 'on' })
    expect(useSettingsStore().soundEnabled).toBe(true)
  })

  it('mémorise le choix à chaque bascule', () => {
    const data = stubStorage()
    const settings = useSettingsStore()
    settings.toggleSound()
    expect(settings.soundEnabled).toBe(false)
    expect(data.get(SOUND_STORAGE_KEY)).toBe('off')
    settings.toggleSound()
    expect(settings.soundEnabled).toBe(true)
    expect(data.get(SOUND_STORAGE_KEY)).toBe('on')
  })

  it('joue les sons seulement quand le son est activé', () => {
    stubStorage()
    const settings = useSettingsStore()
    settings.play('open')
    expect(playSoundMock).toHaveBeenCalledWith('open')

    settings.toggleSound()
    settings.play('back')
    expect(playSoundMock).toHaveBeenCalledTimes(1)
  })

  it('fonctionne sans stockage du navigateur', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('refusé')
      },
      setItem: () => {
        throw new Error('refusé')
      },
    })
    const settings = useSettingsStore()
    expect(settings.soundEnabled).toBe(true)
    expect(() => settings.toggleSound()).not.toThrow()
    expect(settings.soundEnabled).toBe(false)
  })
})
