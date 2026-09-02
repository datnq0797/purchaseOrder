export interface User {
  id: number
  name: string
  email: string
}

export interface Category {
  id: number
  name: string
  slug: string
  products_count?: number
  created_at: string
}

export interface Product {
  id: number
  category_id: number | null
  category: Category | null
  name: string
  sku: string
  unit: string
  cost_price: number
  price: number
  stock_quantity: number
  min_stock: number
  is_low_stock: boolean
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled'

export interface OrderItem {
  id: number
  product_id: number | null
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface Order {
  id: number
  order_code: string
  customer_name: string
  customer_phone: string | null
  customer_address: string | null
  status: OrderStatus
  order_date: string
  total_amount: number
  notes: string | null
  items: OrderItem[]
  items_count?: number
  created_at: string
}

export interface OrderItemInput {
  product_id: number
  quantity: number
}

export interface OrderFormInput {
  customer_name: string
  customer_phone?: string
  customer_address?: string
  status: OrderStatus
  order_date: string
  notes?: string
  items: OrderItemInput[]
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface DashboardSummary {
  revenue: number
  orders_count: number
  products_count: number
  low_stock_count: number
  period_days: number
}

export interface RevenuePoint {
  date: string
  revenue: number
  orders_count: number
}

export interface OrdersByStatusRow {
  status: OrderStatus
  count: number
}

export interface StockOverviewRow {
  id: number
  name: string
  stock_quantity: number
  min_stock: number
}

export interface TopProductRow {
  product_id: number
  product_name: string
  total_quantity: number
  total_revenue: number
}

export interface PdfImportItem {
  line_raw: string
  product_name: string
  quantity: number
  low_confidence: boolean
  matched_product_id: number | null
  matched_product_name: string | null
  unit_price: number | null
}

export interface PdfImportResult {
  raw_text: string
  items: PdfImportItem[]
}

export interface ApiErrorResponse {
  message: string
  errors?: Record<string, string[]>
}
