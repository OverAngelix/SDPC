import type { InternalAxiosRequestConfig } from 'axios'
import { AxiosError } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, setUnauthorizedHandler } from '@/api/http'

const adapter = http.defaults.adapter

/** Fait répondre le serveur avec ce code, sans réseau. */
function respondWith (status: number) {
  http.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    throw new AxiosError('refusé', undefined, config, undefined, {
      status, statusText: '', headers: {}, config, data: { error: 'refusé' },
    })
  }
}

describe('http : session perdue', () => {
  const lost = vi.fn()

  beforeEach(() => {
    lost.mockReset()
    setUnauthorizedHandler(lost)
  })

  afterEach(() => {
    http.defaults.adapter = adapter
  })

  it('un 401 hors de /auth ferme la session côté client', async () => {
    respondWith(401)
    await expect(http.get('/buttons')).rejects.toThrow()
    expect(lost).toHaveBeenCalledOnce()
  })

  it('un 403 (mot de passe actuel faux) ne déconnecte pas, sur /account comme ailleurs', async () => {
    respondWith(403)
    await expect(http.put('/account/password', {})).rejects.toThrow()
    await expect(http.delete('/account', { data: {} })).rejects.toThrow()
    expect(lost).not.toHaveBeenCalled()
  })

  it('un 401 de /auth/login est une réponse normale', async () => {
    respondWith(401)
    await expect(http.post('/auth/login', {})).rejects.toThrow()
    expect(lost).not.toHaveBeenCalled()
  })
})
