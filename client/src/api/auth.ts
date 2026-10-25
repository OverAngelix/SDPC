import type { Credentials, User } from '@/interfaces/auth'
import { http } from './http'

export async function fetchMe (): Promise<User> {
  const { data } = await http.get<User>('/auth/me')
  return data
}

export async function login (credentials: Credentials): Promise<User> {
  const { data } = await http.post<User>('/auth/login', credentials)
  return data
}

export async function register (credentials: Credentials): Promise<User> {
  const { data } = await http.post<User>('/auth/register', credentials)
  return data
}

export async function logout (): Promise<void> {
  await http.post('/auth/logout')
}
