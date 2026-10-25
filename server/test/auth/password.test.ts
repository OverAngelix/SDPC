import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { hashPassword, verifyPassword } from '../../src/auth/password.js'

describe('mot de passe', () => {
  it('reconnaît le bon mot de passe et refuse un autre', async () => {
    const hash = await hashPassword('correct horse')
    assert.equal(await verifyPassword('correct horse', hash), true)
    assert.equal(await verifyPassword('correct horsf', hash), false)
  })

  it('ne contient pas le mot de passe et change à chaque fois (sel)', async () => {
    const first = await hashPassword('secret123')
    const second = await hashPassword('secret123')
    assert.match(first, /^scrypt\$\d+\$[0-9a-f]+\$[0-9a-f]+$/)
    assert.ok(!first.includes('secret123'))
    assert.notEqual(first, second)
  })

  it('refuse un haché illisible', async () => {
    assert.equal(await verifyPassword('x', ''), false)
    assert.equal(await verifyPassword('x', 'md5$1$aa$bb'), false)
    assert.equal(await verifyPassword('x', 'scrypt$abc$aa$bb'), false)
    assert.equal(await verifyPassword('x', 'scrypt$32768$aa$bb'), false)
  })
})
