import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { validateChangePassword, validateDeleteAccount } from '../../src/account/validation.js'

describe('validateChangePassword', () => {
  it('accepte un mot de passe actuel et un nouveau mot de passe différent', () => {
    const result = validateChangePassword({ currentPassword: 'motdepasse', newPassword: 'nouveaumdp' })
    assert.deepEqual(result, { ok: true, value: { currentPassword: 'motdepasse', newPassword: 'nouveaumdp' } })
  })

  it('refuse un corps qui n\'est pas un objet', () => {
    for (const body of [undefined, null, 'texte', ['a']]) {
      assert.equal(validateChangePassword(body).ok, false)
    }
  })

  it('exige le mot de passe actuel', () => {
    for (const currentPassword of [undefined, '', 12]) {
      const result = validateChangePassword({ currentPassword, newPassword: 'nouveaumdp' })
      assert.deepEqual(result, { ok: false, errors: ['currentPassword : mot de passe requis'] })
    }
  })

  it('refuse un nouveau mot de passe absent, trop court ou trop long', () => {
    const errors = (newPassword: unknown) => {
      const result = validateChangePassword({ currentPassword: 'motdepasse', newPassword })
      return result.ok ? [] : result.errors
    }
    assert.deepEqual(errors(undefined), ['newPassword : mot de passe requis'])
    assert.deepEqual(errors('court'), ['newPassword : 8 caractères au moins'])
    assert.deepEqual(errors('x'.repeat(129)), ['newPassword : 128 caractères au plus'])
  })

  it('refuse un nouveau mot de passe identique à l\'actuel', () => {
    const result = validateChangePassword({ currentPassword: 'motdepasse', newPassword: 'motdepasse' })
    assert.deepEqual(result, { ok: false, errors: ['newPassword : doit être différent du mot de passe actuel'] })
  })

  it('liste toutes les erreurs', () => {
    const result = validateChangePassword({})
    assert.deepEqual(result, { ok: false, errors: ['currentPassword : mot de passe requis', 'newPassword : mot de passe requis'] })
  })
})

describe('validateDeleteAccount', () => {
  it('accepte un mot de passe', () => {
    assert.deepEqual(validateDeleteAccount({ password: 'motdepasse' }), { ok: true, value: { password: 'motdepasse' } })
  })

  it('refuse un mot de passe absent, vide ou démesuré, et un corps qui n\'est pas un objet', () => {
    assert.equal(validateDeleteAccount(undefined).ok, false)
    assert.equal(validateDeleteAccount({}).ok, false)
    assert.equal(validateDeleteAccount({ password: '' }).ok, false)
    assert.equal(validateDeleteAccount({ password: 'x'.repeat(129) }).ok, false)
  })
})
