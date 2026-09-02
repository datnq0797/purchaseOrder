import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { deleteOrder, exportOrderExcel, fetchOrders, updateOrderStatus } from '@/api/orders'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/format'
import { useAsyncData } from '@/lib/useAsyncData'
import type { Order, OrderStatus } from '@/types'

const STATUS_OPTIONS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
]

export function OrdersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null)

  const { data, isLoading, error, reload } = useAsyncData(
    () => fetchOrders({ search: search || undefined, status: status || undefined, page, per_page: 10 }),
    [search, status, page],
  )

  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(order.id, newStatus)
      toast.success('Đã cập nhật trạng thái đơn hàng')
      reload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleExport = async (order: Order) => {
    try {
      await exportOrderExcel(order.id, order.order_code)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteOrder(deleteTarget.id)
      toast.success('Đã xóa đơn hàng')
      setDeleteTarget(null)
      reload()
    } catch (error) {
      toast.error(getErrorMessage(error))
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Đơn hàng</h1>
          <p className="text-sm text-slate-500">Quản lý đơn hàng bán ra</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/orders/import"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Nhập từ PDF
          </Link>
          <Link
            to="/orders/create"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Tạo đơn hàng
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => {
            setPage(1)
            setSearch(e.target.value)
          }}
          placeholder="Tìm theo mã đơn hoặc khách hàng..."
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1)
            setStatus(e.target.value as OrderStatus | '')
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <EmptyState title="Không thể tải đơn hàng" description={error} />}

      {!isLoading && !error && data?.data.length === 0 && (
        <EmptyState title="Chưa có đơn hàng nào" description="Tạo đơn hàng mới hoặc nhập từ file PDF." />
      )}

      {!isLoading && data && data.data.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Mã đơn</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Khách hàng</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Ngày đặt</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">Tổng tiền</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Trạng thái</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{order.order_code}</td>
                    <td className="px-4 py-3 text-slate-700">{order.customer_name}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(order.order_date)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(order.total_amount)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                        className="rounded-lg border-none bg-transparent text-xs focus:ring-0"
                      >
                        <option value="pending">Chờ xử lý</option>
                        <option value="processing">Đang xử lý</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                      <div className="mt-1">
                        <StatusBadge status={order.status} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleExport(order)}
                          className="rounded-lg px-3 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                        >
                          Xuất Excel
                        </button>
                        <Link
                          to={`/orders/${order.id}/edit`}
                          className="rounded-lg px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          Sửa
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(order)}
                          className="rounded-lg px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              Trang {data.meta.current_page}/{data.meta.last_page} · {data.meta.total} đơn hàng
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                disabled={page >= data.meta.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Xóa đơn hàng "${deleteTarget?.order_code}"?`}
        description="Tồn kho đã trừ cho đơn này sẽ được hoàn lại (nếu chưa hủy)."
        confirmLabel="Xóa"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
