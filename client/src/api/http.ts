import axios from 'axios'

// En développement, le proxy Vite redirige /api vers le serveur (port 4000).
// En production, VITE_API_URL pointe vers l'URL publique de l'API.
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 5000,
  // Cookie de session, aussi quand l'API est sur une autre origine
  withCredentials: true,
})

let onUnauthorized: (() => void) | undefined

/** Appelé quand le serveur répond 401 hors de /auth (session expirée ou supprimée). */
export function setUnauthorizedHandler (handler: () => void) {
  onUnauthorized = handler
}

http.interceptors.response.use(undefined, (error: unknown) => {
  // Un 401 de /auth/login (mauvais mot de passe) ou de /auth/me est une réponse normale, pas une session perdue
  if (axios.isAxiosError(error) && error.response?.status === 401 && !error.config?.url?.startsWith('/auth/')) {
    onUnauthorized?.()
  }
  return Promise.reject(error)
})
