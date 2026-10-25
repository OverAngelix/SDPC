import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { LoginLimiter } from '../../src/auth/loginLimiter.js'

describe('LoginLimiter', () => {
  function limiter (maxFailures = 3, windowMs = 60_000) {
    const clock = { now: 1_000_000 }
    return { clock, limiter: new LoginLimiter(maxFailures, windowMs, () => clock.now) }
  }

  it('ne bloque pas avant le nombre d\'échecs permis', () => {
    const { limiter: l } = limiter()
    l.recordFailure('a')
    l.recordFailure('a')
    assert.equal(l.blockedFor('a'), 0)
  })

  it('bloque au dernier échec permis et indique l\'attente restante', () => {
    const { clock, limiter: l } = limiter()
    for (let i = 0; i < 3; i++) l.recordFailure('a')
    assert.equal(l.blockedFor('a'), 60)
    clock.now += 45_500
    assert.equal(l.blockedFor('a'), 15)
  })

  it('débloque à la fin de la fenêtre et oublie les échecs', () => {
    const { clock, limiter: l } = limiter()
    for (let i = 0; i < 3; i++) l.recordFailure('a')
    clock.now += 60_000
    assert.equal(l.blockedFor('a'), 0)
    l.recordFailure('a')
    assert.equal(l.blockedFor('a'), 0)
  })

  it('compte chaque clé séparément', () => {
    const { limiter: l } = limiter()
    for (let i = 0; i < 3; i++) l.recordFailure('a')
    assert.equal(l.blockedFor('b'), 0)
  })

  it('reset efface les échecs', () => {
    const { limiter: l } = limiter()
    for (let i = 0; i < 3; i++) l.recordFailure('a')
    l.reset('a')
    assert.equal(l.blockedFor('a'), 0)
  })
})
