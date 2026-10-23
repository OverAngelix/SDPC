import { http } from './http'

export interface HealthResponse {
  status: 'ok'
}

export async function fetchHealth (): Promise<HealthResponse> {
  const { data } = await http.get<HealthResponse>('/health')
  return data
}
