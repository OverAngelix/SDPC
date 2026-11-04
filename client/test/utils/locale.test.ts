import { describe, expect, it } from 'vitest'
import { deviceLocale, resolveLocale } from '@/utils/locale'

describe('deviceLocale', () => {
  it('choisit le français quand il est la première langue préférée', () => {
    expect(deviceLocale(['fr-FR', 'en-US'])).toBe('fr')
    expect(deviceLocale(['fr'])).toBe('fr')
    expect(deviceLocale(['FR-ca'])).toBe('fr')
  })

  it('choisit l\'anglais pour toute autre première langue, même si le français vient après', () => {
    expect(deviceLocale(['en-US', 'fr'])).toBe('en')
    expect(deviceLocale(['de-DE'])).toBe('en')
    expect(deviceLocale(['es'])).toBe('en')
  })

  it('retombe sur le français quand rien n\'est connu', () => {
    expect(deviceLocale([])).toBe('fr')
  })
})

describe('resolveLocale', () => {
  it('garde une langue choisie, quelle que soit celle de l\'appareil', () => {
    expect(resolveLocale('fr', ['en-US'])).toBe('fr')
    expect(resolveLocale('en', ['fr-FR'])).toBe('en')
  })

  it('suit l\'appareil pour system', () => {
    expect(resolveLocale('system', ['fr-FR'])).toBe('fr')
    expect(resolveLocale('system', ['ja'])).toBe('en')
  })
})
