import { apiClient } from './client'
import type { PaginatedResponse, Product } from '@/types'

export interface ProductFilters {
  search?: string
  category_id?: number
  low_stock?: boolean
  page?: number
  per_page?: number
}

export interface ProductFormInput {
  category_id: number | null
  name: string
  sku: string
  unit: string
  cost_price: number
  price: number
  stock_quantity: number
  min_stock: number
  description?: string
  is_active: boolean
}

export async function fetchProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
  const { data } = await apiClient.get('/products', {
    params: {
      ...filters,
      low_stock: filters.low_stock ? '1' : undefined,
    },
  })
  return data
}

export async function fetchProduct(id: number): Promise<Product> {
  const { data } = await apiClient.get(`/products/${id}`)
  return data
}

export async function createProduct(input: ProductFormInput): Promise<Product> {
  const { data } = await apiClient.post('/products', input)
  return data
}

export async function updateProduct(id: number, input: ProductFormInput): Promise<Product> {
  const { data } = await apiClient.put(`/products/${id}`, input)
  return data
}

export async function deleteProduct(id: number): Promise<void> {
  await apiClient.delete(`/products/${id}`)
}
