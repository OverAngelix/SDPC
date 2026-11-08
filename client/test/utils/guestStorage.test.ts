import type { Button } from '@/interfaces/button'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearGuestData,
  GUEST_BUTTONS_KEY,
  GUEST_SETTINGS_KEY,
  GUEST_STORAGE_KEY,
  readGuestActive,
  readGuestButtons,
  readGuestSettings,
  writeGuestActive,
  writeGuestButtons,
  writeGuestSettings,
} from '@/utils/guestStorage'
import { stubRefusedStorage, stubStorage } from '../helpers/storage'

const github: Button = { id: 'github', parentId: null, position: 0, label: 'GitHub', icon: 'mdi-github', type: 'action', url: 'https://github.com' }

describe('guestStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('n\'est pas en mode invité et n\'a ni grille ni réglages au départ', () => {
    stubStorage()
    expect(readGuestActive()).toBe(false)
    expect(readGuestButtons()).toBeNull()
    expect(readGuestSettings()).toEqual({})
  })

  it('retient le mode invité, puis l\'oublie', () => {
    const data = stubStorage()
    writeGuestActive(true)
    expect(data.get(GUEST_STORAGE_KEY)).toBe('1')
    expect(readGuestActive()).toBe(true)
    writeGuestActive(false)
    expect(data.has(GUEST_STORAGE_KEY)).toBe(false)
  })

  it('écrit puis relit la grille et les réglages', () => {
    stubStorage()
    writeGuestButtons([github])
    writeGuestSettings({ soundEnabled: false, volume: 30, effectsEnabled: true, theme: 'dark', locale: 'en' })
    expect(readGuestButtons()).toEqual([github])
    expect(readGuestSettings()).toEqual({ soundEnabled: false, volume: 30, effectsEnabled: true, theme: 'dark', locale: 'en' })
  })

  it('écarte une grille illisible et les boutons mal formés', () => {
    stubStorage({ [GUEST_BUTTONS_KEY]: '{pas du json' })
    expect(readGuestButtons()).toBeNull()

    stubStorage({ [GUEST_BUTTONS_KEY]: JSON.stringify([github, { id: 'x' }, 'y']) })
    expect(readGuestButtons()).toEqual([github])
  })

  it('ne reprend que les réglages du bon type', () => {
    stubStorage({ [GUEST_SETTINGS_KEY]: JSON.stringify({ soundEnabled: 'oui', volume: 50, theme: 'rose', locale: 'fr', autre: 1 }) })
    expect(readGuestSettings()).toEqual({ volume: 50, locale: 'fr' })
  })

  it('efface tout ce que l\'invité a laissé', () => {
    const data = stubStorage({ [GUEST_STORAGE_KEY]: '1', [GUEST_BUTTONS_KEY]: '[]', [GUEST_SETTINGS_KEY]: '{}', 'sdpc.welcomeSeen': '1' })
    clearGuestData()
    expect([...data.keys()]).toEqual(['sdpc.welcomeSeen'])
  })

  it('tient en mémoire quand le stockage est refusé', () => {
    stubRefusedStorage()
    writeGuestActive(true)
    writeGuestButtons([github])
    expect(readGuestActive()).toBe(true)
    expect(readGuestButtons()).toEqual([github])
    clearGuestData()
    expect(readGuestActive()).toBe(false)
  })
})
