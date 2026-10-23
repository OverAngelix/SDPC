import type { ApiErrorBody, ApiErrorMessage } from '@/interfaces/api'
import axios from 'axios'

/**
 * Traduit une erreur d'appel à l'API en message affichable.
 * Les erreurs 400 et 409 du serveur portent déjà un texte en français : on le reprend.
 */
export function describeApiError (error: unknown): ApiErrorMessage {
  if (!axios.isAxiosError<Partial<ApiErrorBody>>(error)) {
    return { title: 'Une erreur inattendue est survenue.', details: [] }
  }
  if (!error.response) {
    return { title: 'Le serveur est injoignable.', details: [] }
  }

  const { status, data } = error.response
  const title = typeof data?.error === 'string' && data.error !== '' ? data.error : `Le serveur a répondu avec une erreur (${status}).`
  const details = Array.isArray(data?.details) ? data.details.filter(detail => typeof detail === 'string') : []
  return { title, details }
}
