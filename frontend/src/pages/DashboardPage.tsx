import { OrdersStatusPie } from '@/components/charts/OrdersStatusPie'
import { RevenueLineChart } from '@/components/charts/RevenueLineChart'
import { StockBarChart } from '@/components/charts/StockBarChart'
import { TopProductsBarChart } from '@/components/charts/TopProductsBarChart'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { fetchOrdersByStatus, fetchRevenueByTime, fetchStockOverview, fetchSummary, fetchTopProducts } from '@/api/dashboard'
import { formatCurrency } from '@/lib/format'
import { useAsyncData } from '@/lib/useAsyncData'

const PERIOD_DAYS = 30

function KpiCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  )
}

export function DashboardPage() {
  const summary = useAsyncData(() => fetchSummary(PERIOD_DAYS), [])
  const revenue = useAsyncData(() => fetchRevenueByTime(PERIOD_DAYS), [])
  const ordersByStatus = useAsyncData(() => fetchOrdersByStatus(PERIOD_DAYS), [])
  const stockOverview = useAsyncData(() => fetchStockOverview(8), [])
  const topProducts = useAsyncData(() => fetchTopProducts(PERIOD_DAYS, 5), [])

  const isInitialLoading = summary.isLoading && !summary.data

  if (isInitialLoading) {
    return <LoadingSpinner label="Đang tải dashboard..." />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Tổng quan {PERIOD_DAYS} ngày gần nhất</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Doanh số" value={formatCurrency(summary.data?.revenue ?? 0)} tone="text-indigo-600" />
        <KpiCard label="Tổng đơn hàng" value={String(summary.data?.orders_count ?? 0)} tone="text-blue-600" />
        <KpiCard label="Sản phẩm" value={String(summary.data?.products_count ?? 0)} tone="text-emerald-600" />
        <KpiCard
          label="Sắp hết hàng"
          value={String(summary.data?.low_stock_count ?? 0)}
          tone="text-rose-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Doanh số theo thời gian">
          {revenue.data ? <RevenueLineChart data={revenue.data} /> : <LoadingSpinner />}
        </ChartCard>
        <ChartCard title="Đơn hàng theo trạng thái">
          {ordersByStatus.data ? <OrdersStatusPie data={ordersByStatus.data} /> : <LoadingSpinner />}
        </ChartCard>
        <ChartCard title="Tồn kho thấp nhất">
          {stockOverview.data ? <StockBarChart data={stockOverview.data} /> : <LoadingSpinner />}
        </ChartCard>
        <ChartCard title="Top sản phẩm bán chạy">
          {topProducts.data ? <TopProductsBarChart data={topProducts.data} /> : <LoadingSpinner />}
        </ChartCard>
      </div>
    </div>
  )
}
