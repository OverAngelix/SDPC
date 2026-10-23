import type { HealthResponse } from '@/interfaces/health'
import { http } from './http'

export async function fetchHealth (): Promise<HealthResponse> {
  const { data } = await http.get<HealthResponse>('/health')
  return data
}
