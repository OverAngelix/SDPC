import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { validateSettingsPatch } from '../../src/settings/validation.js'

describe('validateSettingsPatch', () => {
  it('accepte chaque réglage, y compris les bornes du volume', () => {
    assert.deepEqual(validateSettingsPatch({ soundEnabled: false, volume: 0, effectsEnabled: false, theme: 'dark' }), {
      ok: true,
      value: { soundEnabled: false, volume: 0, effectsEnabled: false, theme: 'dark' },
    })
    assert.deepEqual(validateSettingsPatch({ volume: 100 }), { ok: true, value: { volume: 100 } })
  })

  it('accepte une modification vide et ne renvoie que les champs envoyés', () => {
    assert.deepEqual(validateSettingsPatch({}), { ok: true, value: {} })
    assert.deepEqual(validateSettingsPatch({ theme: 'light' }), { ok: true, value: { theme: 'light' } })
  })

  it('refuse un corps qui n\'est pas un objet', () => {
    for (const body of [undefined, null, 'x', [], 3]) {
      assert.equal(validateSettingsPatch(body).ok, false)
    }
  })

  it('refuse un volume hors plage, non entier ou non numérique', () => {
    for (const volume of [-1, 101, 50.5, '50', null, Number.NaN]) {
      const result = validateSettingsPatch({ volume })
      assert.equal(result.ok, false, String(volume))
      if (!result.ok) assert.ok(result.errors[0].startsWith('volume'))
    }
  })

  it('refuse un booléen qui n\'en est pas un', () => {
    for (const field of ['soundEnabled', 'effectsEnabled']) {
      for (const value of [1, 'true', null]) {
        assert.equal(validateSettingsPatch({ [field]: value }).ok, false, `${field} ${String(value)}`)
      }
    }
  })

  it('refuse un thème inconnu', () => {
    for (const theme of ['rouge', '', null, 1]) {
      assert.equal(validateSettingsPatch({ theme }).ok, false, String(theme))
    }
  })

  it('refuse un réglage inconnu et liste toutes les erreurs', () => {
    const result = validateSettingsPatch({ couleur: 'rouge', volume: 200 })
    assert.equal(!result.ok && result.errors.length, 2)
    assert.ok(!result.ok && result.errors.some(error => error.startsWith('couleur')))
  })
})
