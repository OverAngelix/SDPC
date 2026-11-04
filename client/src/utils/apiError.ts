import type { ApiErrorBody, ApiErrorMessage, ApiIssue } from '@/interfaces/api'
import axios from 'axios'
import { i18n } from '@/plugins/i18n'

// Hors composant : la langue active est celle de l'instance partagée
const { t, te } = i18n.global

/** Le problème d'un champ dans la langue active, ou `fallback` (texte du serveur) si le code est inconnu du client. */
function describeIssue (issue: ApiIssue, fallback: string | undefined): string | undefined {
  const key = `issues.${issue.code}`
  if (!te(key)) {
    return fallback
  }
  const message = t(key, issue.params ?? {})
  return issue.field === undefined ? message : t('errors.field', { field: issue.field, message })
}

/**
 * Traduit une erreur d'appel à l'API en message affichable, dans la langue active.
 * Le serveur envoie des codes : un code connu est traduit, sinon on reprend son texte français.
 */
export function describeApiError (error: unknown): ApiErrorMessage {
  if (!axios.isAxiosError<Partial<ApiErrorBody>>(error)) {
    return { title: t('errors.unexpected'), details: [] }
  }
  if (!error.response) {
    return { title: t('errors.unreachable'), details: [] }
  }

  const { status, data } = error.response
  const text = typeof data?.error === 'string' && data.error !== '' ? data.error : undefined
  const key = `errors.${data?.code}`
  const title = typeof data?.code === 'string' && te(key) ? t(key) : text ?? t('errors.serverStatus', { status })

  const fallbacks = Array.isArray(data?.details) ? data.details.filter(detail => typeof detail === 'string') : []
  const details = Array.isArray(data?.issues)
    ? data.issues.flatMap((issue, index) => describeIssue(issue, fallbacks[index]) ?? [])
    : fallbacks
  return { title, details }
}
