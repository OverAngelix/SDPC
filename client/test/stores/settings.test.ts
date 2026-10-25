import type { Settings } from '@/interfaces/settings'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchSettings, updateSettings } from '@/api/settings'
import { DEFAULT_SETTINGS, useSettingsStore } from '@/stores/settings'
import { playSound } from '@/utils/sounds'

vi.mock('@/utils/sounds', () => ({ playSound: vi.fn() }))
vi.mock('@/api/settings', () => ({ fetchSettings: vi.fn(), updateSettings: vi.fn() }))

const playSoundMock = vi.mocked(playSound)
const fetchSettingsMock = vi.mocked(fetchSettings)
const updateSettingsMock = vi.mocked(updateSettings)

const saved: Settings = { soundEnabled: false, volume: 40, effectsEnabled: false, theme: 'dark' }

describe('settings store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    playSoundMock.mockReset()
    fetchSettingsMock.mockReset()
    updateSettingsMock.mockReset()
  })

  it('démarre avec les valeurs par défaut', () => {
    const settings = useSettingsStore()
    expect(settings.soundEnabled).toBe(true)
    expect(settings.volume).toBe(100)
    expect(settings.effectsEnabled).toBe(true)
    expect(settings.theme).toBe('system')
    expect(settings.error).toBeNull()
  })

  it('load reprend les réglages du compte', async () => {
    fetchSettingsMock.mockResolvedValue(saved)
    const settings = useSettingsStore()
    await settings.load()
    expect([settings.soundEnabled, settings.volume, settings.effectsEnabled, settings.theme]).toEqual([false, 40, false, 'dark'])
  })

  it('load laisse remonter l\'erreur du serveur et garde les valeurs actuelles', async () => {
    fetchSettingsMock.mockRejectedValue(new Error('401'))
    const settings = useSettingsStore()
    await expect(settings.load()).rejects.toThrow('401')
    expect(settings.volume).toBe(100)
  })

  it('reset revient aux valeurs par défaut et efface l\'erreur', async () => {
    fetchSettingsMock.mockResolvedValue(saved)
    const settings = useSettingsStore()
    await settings.load()
    settings.reset()
    expect({ soundEnabled: settings.soundEnabled, volume: settings.volume, effectsEnabled: settings.effectsEnabled, theme: settings.theme }).toEqual(DEFAULT_SETTINGS)
  })

  it('change applique tout de suite, enregistre seulement ce qui change et réussit', async () => {
    let applied: number | undefined
    const settings = useSettingsStore()
    updateSettingsMock.mockImplementation(async () => {
      applied = settings.volume
      return { ...DEFAULT_SETTINGS, volume: 25 }
    })

    await expect(settings.change({ volume: 25 })).resolves.toBe(true)

    expect(applied).toBe(25)
    expect(updateSettingsMock).toHaveBeenCalledWith({ volume: 25 })
    expect(settings.volume).toBe(25)
    expect(settings.error).toBeNull()
  })

  it('change remet la valeur précédente et explique quand le serveur refuse', async () => {
    updateSettingsMock.mockRejectedValue(new Error('réseau'))
    const settings = useSettingsStore()

    await expect(settings.change({ theme: 'dark', soundEnabled: false })).resolves.toBe(false)

    expect(settings.theme).toBe('system')
    expect(settings.soundEnabled).toBe(true)
    expect(settings.error).not.toBeNull()
  })

  it('change ne touche pas aux réglages qui n\'étaient pas concernés en cas d\'échec', async () => {
    updateSettingsMock.mockRejectedValue(new Error('réseau'))
    const settings = useSettingsStore()
    settings.effectsEnabled = false

    await settings.change({ volume: 10 })

    expect(settings.effectsEnabled).toBe(false)
    expect(settings.volume).toBe(100)
  })

  it('un nouveau changement efface l\'erreur précédente', async () => {
    const settings = useSettingsStore()
    updateSettingsMock.mockRejectedValueOnce(new Error('réseau'))
    await settings.change({ volume: 10 })
    expect(settings.error).not.toBeNull()

    updateSettingsMock.mockResolvedValue(DEFAULT_SETTINGS)
    await settings.change({ volume: 10 })
    expect(settings.error).toBeNull()
  })

  it('joue les sons au volume choisi, seulement quand le son est activé', async () => {
    updateSettingsMock.mockResolvedValue(DEFAULT_SETTINGS)
    const settings = useSettingsStore()
    settings.play('open')
    expect(playSoundMock).toHaveBeenLastCalledWith('open', 1)

    await settings.change({ volume: 30 })
    settings.play('back')
    expect(playSoundMock).toHaveBeenLastCalledWith('back', 0.3)

    await settings.change({ soundEnabled: false })
    settings.play('launch')
    expect(playSoundMock).toHaveBeenCalledTimes(2)
  })
})
