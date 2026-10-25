import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { PASSWORD_MAX_LENGTH, validateCredentials } from '../../src/auth/validation.js'

describe('validateCredentials', () => {
  it('accepte une adresse et un mot de passe valides, adresse mise en minuscules', () => {
    assert.deepEqual(validateCredentials({ email: '  Jean.Dupont@Exemple.FR ', password: 'motdepasse' }, 'register'), {
      ok: true,
      value: { email: 'jean.dupont@exemple.fr', password: 'motdepasse' },
    })
  })

  it('refuse un corps qui n\'est pas un objet', () => {
    for (const body of [undefined, null, 'x', [], 3]) {
      assert.equal(validateCredentials(body, 'login').ok, false)
    }
  })

  it('refuse une adresse absente ou invalide', () => {
    for (const email of [undefined, '', '   ', 'pas-une-adresse', 'a@b', 'a b@c.fr', `${'a'.repeat(250)}@b.fr`, 42]) {
      const result = validateCredentials({ email, password: 'motdepasse' }, 'login')
      assert.equal(result.ok, false, String(email))
      if (!result.ok) assert.ok(result.errors.some(error => error.startsWith('email')))
    }
  })

  it('exige 8 caractères à l\'inscription seulement', () => {
    assert.equal(validateCredentials({ email: 'a@b.fr', password: 'court' }, 'register').ok, false)
    assert.equal(validateCredentials({ email: 'a@b.fr', password: 'court' }, 'login').ok, true)
  })

  it('refuse un mot de passe absent, vide, non textuel ou démesuré', () => {
    for (const password of [undefined, '', 12345678, 'x'.repeat(PASSWORD_MAX_LENGTH + 1)]) {
      assert.equal(validateCredentials({ email: 'a@b.fr', password }, 'login').ok, false, String(password))
    }
    assert.equal(validateCredentials({ email: 'a@b.fr', password: 'x'.repeat(PASSWORD_MAX_LENGTH) }, 'login').ok, true)
  })

  it('garde les espaces du mot de passe', () => {
    const result = validateCredentials({ email: 'a@b.fr', password: '  espaces  ' }, 'register')
    assert.deepEqual(result.ok && result.value.password, '  espaces  ')
  })

  it('liste toutes les erreurs', () => {
    const result = validateCredentials({}, 'register')
    assert.equal(!result.ok && result.errors.length, 2)
  })
})
