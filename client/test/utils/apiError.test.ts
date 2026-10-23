import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { describeApiError } from '@/utils/apiError'

function serverError (status: number, data: unknown) {
  const error = new AxiosError('Request failed', 'ERR_BAD_REQUEST')
  error.response = { status, data, statusText: '', headers: {}, config: {} as never }
  return error
}

describe('describeApiError', () => {
  it('reprend le titre et le détail d\'une erreur 400', () => {
    const error = serverError(400, { error: 'Données invalides', details: ['url : adresse invalide'] })
    expect(describeApiError(error)).toEqual({ title: 'Données invalides', details: ['url : adresse invalide'] })
  })

  it('reprend le message d\'une erreur 409', () => {
    const error = serverError(409, { error: 'Emplacement déjà occupé', details: ['position : l\'emplacement 3 est pris dans ce dossier'] })
    expect(describeApiError(error).title).toBe('Emplacement déjà occupé')
  })

  it('accepte une réponse sans détail', () => {
    expect(describeApiError(serverError(404, { error: 'Bouton introuvable' }))).toEqual({ title: 'Bouton introuvable', details: [] })
  })

  it('indique le code quand la réponse n\'a pas le format attendu', () => {
    expect(describeApiError(serverError(502, '<html>Bad Gateway</html>')).title).toContain('502')
  })

  it('signale un serveur injoignable quand il n\'y a pas de réponse', () => {
    expect(describeApiError(new AxiosError('Network Error', 'ERR_NETWORK')).title).toBe('Le serveur est injoignable.')
  })

  it('traite toute autre erreur comme inattendue', () => {
    expect(describeApiError(new Error('boom')).title).toBe('Une erreur inattendue est survenue.')
  })
})
