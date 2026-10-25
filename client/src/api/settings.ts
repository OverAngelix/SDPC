import type { Settings } from '@/interfaces/settings'
import { http } from './http'

export async function fetchSettings (): Promise<Settings> {
  const { data } = await http.get<Settings>('/settings')
  return data
}

/** Modifie les réglages envoyés ; le serveur renvoie l'ensemble. */
export async function updateSettings (patch: Partial<Settings>): Promise<Settings> {
  const { data } = await http.patch<Settings>('/settings', patch)
  return data
}
