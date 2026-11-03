import type { ChangePasswordPayload } from '@/interfaces/account'
import { http } from './http'

export async function changePassword (payload: ChangePasswordPayload): Promise<void> {
  await http.put('/account/password', payload)
}

/** Supprime le compte de la personne connectée, avec tout ce qu'il contient. */
export async function deleteAccount (password: string): Promise<void> {
  await http.delete('/account', { data: { password } })
}
