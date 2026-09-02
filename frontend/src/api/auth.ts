import { apiClient } from './client'
import type { User } from '@/types'

export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  const { data } = await apiClient.post('/login', { email, password })
  return data
}

export async function logout(): Promise<void> {
  await apiClient.post('/logout')
}

export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get('/me')
  return data
}
