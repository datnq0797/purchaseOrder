import { apiClient } from './client'
import type { Category } from '@/types'

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await apiClient.get('/categories')
  return data
}

export async function createCategory(name: string): Promise<Category> {
  const { data } = await apiClient.post('/categories', { name })
  return data
}

export async function updateCategory(id: number, name: string): Promise<Category> {
  const { data } = await apiClient.put(`/categories/${id}`, { name })
  return data
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/categories/${id}`)
}
