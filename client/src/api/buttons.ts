import type { Button } from '@/interfaces/button'
import { http } from './http'

export async function fetchButtons (): Promise<Button[]> {
  const { data } = await http.get<Button[]>('/buttons')
  return data
}
