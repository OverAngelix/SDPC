import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { errorTexts } from '../helpers/issues.js'
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
      assert.deepEqual(errorTexts(result), ['currentPassword : mot de passe requis'])
    }
  })

  it('refuse un nouveau mot de passe absent, trop court ou trop long', () => {
    const errors = (newPassword: unknown) => {
      const result = validateChangePassword({ currentPassword: 'motdepasse', newPassword })
      return errorTexts(result)
    }
    assert.deepEqual(errors(undefined), ['newPassword : mot de passe requis'])
    assert.deepEqual(errors('court'), ['newPassword : 8 caractères au moins'])
    assert.deepEqual(errors('x'.repeat(129)), ['newPassword : 128 caractères au plus'])
  })

  it('refuse un nouveau mot de passe identique à l\'actuel', () => {
    const result = validateChangePassword({ currentPassword: 'motdepasse', newPassword: 'motdepasse' })
    assert.deepEqual(errorTexts(result), ['newPassword : doit être différent du mot de passe actuel'])
  })

  it('donne à chaque erreur un code et ses paramètres pour le client', () => {
    const issues = (newPassword: unknown) => {
      const result = validateChangePassword({ currentPassword: 'motdepasse', newPassword })
      return result.ok ? [] : result.errors
    }
    assert.deepEqual(issues('court'), [{ field: 'newPassword', code: 'too_short', message: '8 caractères au moins', params: { min: 8 } }])
    assert.deepEqual(issues('x'.repeat(129)), [{ field: 'newPassword', code: 'too_long', message: '128 caractères au plus', params: { max: 128 } }])
    assert.equal(issues('motdepasse')[0]?.code, 'must_differ')
    assert.equal(issues(undefined)[0]?.code, 'required')
  })

  it('liste toutes les erreurs', () => {
    const result = validateChangePassword({})
    assert.deepEqual(errorTexts(result), ['currentPassword : mot de passe requis', 'newPassword : mot de passe requis'])
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
