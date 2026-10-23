import axios from 'axios'

// En développement, le proxy Vite redirige /api vers le serveur (port 4000).
// En production, VITE_API_URL pointe vers l'URL publique de l'API.
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 5000,
})
