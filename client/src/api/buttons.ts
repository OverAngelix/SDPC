import type { Button, ButtonInput, ButtonPatch } from '@/interfaces/button'
import { http } from './http'

export async function fetchButtons (): Promise<Button[]> {
  const { data } = await http.get<Button[]>('/buttons')
  return data
}

export async function createButton (input: ButtonInput): Promise<Button> {
  const { data } = await http.post<Button>('/buttons', input)
  return data
}

export async function updateButton (id: string, patch: ButtonPatch): Promise<Button> {
  const { data } = await http.patch<Button>(`/buttons/${encodeURIComponent(id)}`, patch)
  return data
}

export async function deleteButton (id: string): Promise<void> {
  await http.delete(`/buttons/${encodeURIComponent(id)}`)
}
