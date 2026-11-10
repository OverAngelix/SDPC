import { isHttpUrl } from '@/utils/url'

/**
 * L'adresse du favicon du site de `url`, demandée au service de Google : seul le domaine lui est transmis,
 * jamais le chemin ni la requête. null si l'URL n'est pas une adresse http(s) valide.
 */
export function faviconUrl (url: string | undefined): string | null {
  const value = url?.trim() ?? ''
  if (!isHttpUrl(value)) {
    return null
  }
  const { hostname } = new URL(value)
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`
}
