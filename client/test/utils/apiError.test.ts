import { AxiosError } from 'axios'
import { afterEach, describe, expect, it } from 'vitest'
import { setLocale } from '@/plugins/i18n'
import { describeApiError } from '@/utils/apiError'

function serverError (status: number, data: unknown) {
  const error = new AxiosError('Request failed', 'ERR_BAD_REQUEST')
  error.response = { status, data, statusText: '', headers: {}, config: {} as never }
  return error
}

describe('describeApiError', () => {
  afterEach(() => setLocale('fr'))

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

  describe('codes du serveur', () => {
    const invalid = serverError(400, {
      error: 'Données invalides',
      code: 'invalid_data',
      details: ['label : 50 caractères au plus', 'position : entier de 0 à 27 requis'],
      issues: [
        { field: 'label', code: 'too_long', params: { max: 50 } },
        { field: 'position', code: 'integer_range', params: { min: 0, max: 27 } },
      ],
    })

    it('traduit le titre et chaque problème en français', () => {
      setLocale('fr')
      expect(describeApiError(invalid)).toEqual({
        title: 'Données invalides',
        details: ['label : 50 caractères au plus', 'position : entier de 0 à 27 requis'],
      })
    })

    it('traduit le titre et chaque problème en anglais, paramètres compris', () => {
      setLocale('en')
      expect(describeApiError(invalid)).toEqual({
        title: 'Invalid data',
        details: ['label: at most 50 characters', 'position: an integer from 0 to 27 is required'],
      })
    })

    it('traduit une erreur sans problème détaillé', () => {
      const error = serverError(429, { error: 'Trop de tentatives, réessayez plus tard', code: 'too_many_attempts', details: [], issues: [] })
      setLocale('en')
      expect(describeApiError(error)).toEqual({ title: 'Too many attempts, please try again later', details: [] })
    })

    it('un problème sans champ n\'a pas de préfixe', () => {
      const error = serverError(400, { error: 'x', code: 'invalid_data', issues: [{ code: 'body_not_object' }] })
      setLocale('en')
      expect(describeApiError(error).details).toEqual(['The request body must be a JSON object'])
    })

    it('reprend le texte du serveur pour un code que le client ne connaît pas', () => {
      const error = serverError(400, {
        error: 'Nouvelle erreur',
        code: 'code_du_futur',
        details: ['url : nouveau problème'],
        issues: [{ field: 'url', code: 'probleme_du_futur' }],
      })
      setLocale('en')
      expect(describeApiError(error)).toEqual({ title: 'Nouvelle erreur', details: ['url : nouveau problème'] })
    })

    it('les messages du client lui-même suivent aussi la langue', () => {
      setLocale('en')
      expect(describeApiError(new AxiosError('Network Error', 'ERR_NETWORK')).title).toBe('The server is unreachable.')
      expect(describeApiError(new Error('boom')).title).toBe('An unexpected error occurred.')
      expect(describeApiError(serverError(502, '<html></html>')).title).toBe('The server responded with an error (502).')
    })
  })
})
