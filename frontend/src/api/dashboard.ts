import { apiClient } from './client'
import type { DashboardSummary, OrdersByStatusRow, RevenuePoint, StockOverviewRow, TopProductRow } from '@/types'

export async function fetchSummary(days = 30): Promise<DashboardSummary> {
  const { data } = await apiClient.get('/dashboard/summary', { params: { days } })
  return data
}

export async function fetchRevenueByTime(days = 30): Promise<RevenuePoint[]> {
  const { data } = await apiClient.get('/dashboard/revenue-by-time', { params: { days } })
  return data
}

export async function fetchOrdersByStatus(days = 30): Promise<OrdersByStatusRow[]> {
  const { data } = await apiClient.get('/dashboard/orders-by-status', { params: { days } })
  return data
}

export async function fetchStockOverview(limit = 10): Promise<StockOverviewRow[]> {
  const { data } = await apiClient.get('/dashboard/stock-overview', { params: { limit } })
  return data
}

export async function fetchTopProducts(days = 30, limit = 5): Promise<TopProductRow[]> {
  const { data } = await apiClient.get('/dashboard/top-products', { params: { days, limit } })
  return data
}
