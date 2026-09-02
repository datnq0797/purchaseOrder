import { apiClient } from './client'
import type { Order, OrderFormInput, OrderStatus, PaginatedResponse, PdfImportResult } from '@/types'

export interface OrderFilters {
  status?: OrderStatus
  search?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export async function fetchOrders(filters: OrderFilters = {}): Promise<PaginatedResponse<Order>> {
  const { data } = await apiClient.get('/orders', { params: filters })
  return data
}

export async function fetchOrder(id: number): Promise<Order> {
  const { data } = await apiClient.get(`/orders/${id}`)
  return data
}

export async function createOrder(input: OrderFormInput): Promise<Order> {
  const { data } = await apiClient.post('/orders', input)
  return data
}

export async function updateOrder(id: number, input: OrderFormInput): Promise<Order> {
  const { data } = await apiClient.put(`/orders/${id}`, input)
  return data
}

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
  const { data } = await apiClient.patch(`/orders/${id}/status`, { status })
  return data
}

export async function deleteOrder(id: number): Promise<void> {
  await apiClient.delete(`/orders/${id}`)
}

export async function exportOrderExcel(id: number, orderCode: string): Promise<void> {
  const response = await apiClient.get(`/orders/${id}/export-excel`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.download = `phieu-soan-kho-${orderCode}.xlsx`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function parseOrderPdf(file: File): Promise<PdfImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.post('/orders-import/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export interface ImportConfirmInput {
  customer_name: string
  customer_phone?: string
  customer_address?: string
  order_date: string
  notes?: string
  items: { product_id: number; quantity: number }[]
}

export async function confirmOrderImport(input: ImportConfirmInput): Promise<Order> {
  const { data } = await apiClient.post('/orders-import/confirm', input)
  return data
}
