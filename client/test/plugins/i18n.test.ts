import { afterEach, describe, expect, it } from 'vitest'
import { i18n, setLocale } from '@/plugins/i18n'

describe('plugin i18n', () => {
  afterEach(() => setLocale('fr'))

  it('change la langue des textes à chaud', () => {
    setLocale('en')
    expect(i18n.global.locale.value).toBe('en')
    setLocale('fr')
    expect(i18n.global.locale.value).toBe('fr')
  })

  it('les noms de langues ne sont jamais traduits', () => {
    for (const locale of ['fr', 'en'] as const) {
      setLocale(locale)
      expect(i18n.global.t('languages.fr')).toBe('Français')
      expect(i18n.global.t('languages.en')).toBe('English')
    }
  })

  it('porte les textes de Vuetify dans chaque langue', () => {
    setLocale('en')
    expect(i18n.global.t('$vuetify.close')).toBe('Close')
    setLocale('fr')
    expect(i18n.global.t('$vuetify.close')).toBe('Fermer')
  })

  it('retombe sur le français pour une clé absente de la langue active', () => {
    i18n.global.mergeLocaleMessage('fr', { onlyInFrench: 'Seulement en français' })
    setLocale('en')
    expect(i18n.global.t('onlyInFrench')).toBe('Seulement en français')
  })

  it('accorde les pluriels : en français 0 et 1 sont au singulier, en anglais seul 1 l\'est', () => {
    const cleared = (count: number) => i18n.global.t('notices.gridCleared', count)

    setLocale('fr')
    expect(cleared(0)).toBe('Grille effacée (0 bouton supprimé).')
    expect(cleared(1)).toBe('Grille effacée (1 bouton supprimé).')
    expect(cleared(12)).toBe('Grille effacée (12 boutons supprimés).')

    setLocale('en')
    expect(cleared(1)).toBe('Grid cleared (1 button removed).')
    expect(cleared(12)).toBe('Grid cleared (12 buttons removed).')
  })
})
