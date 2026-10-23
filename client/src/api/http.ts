import axios from 'axios'

// Le proxy Vite redirige /api vers le serveur (port 4000)
export const http = axios.create({
  baseURL: '/api',
  timeout: 5000,
})
