import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { deleteProduct, fetchProducts } from '@/api/products'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatCurrency } from '@/lib/format'
import { useAsyncData } from '@/lib/useAsyncData'
import type { Product } from '@/types'

export function ProductsPage() {
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const { data, isLoading, error, reload } = useAsyncData(
    () => fetchProducts({ search: search || undefined, low_stock: lowStockOnly, page, per_page: 12 }),
    [search, lowStockOnly, page],
  )

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteProduct(deleteTarget.id)
      toast.success('Đã xóa sản phẩm')
      setDeleteTarget(null)
      reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Sản phẩm</h1>
          <p className="text-sm text-slate-500">Quản lý sản phẩm và tồn kho</p>
        </div>
        <Link
          to="/products/create"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Thêm sản phẩm
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => {
            setPage(1)
            setSearch(e.target.value)
          }}
          placeholder="Tìm theo tên hoặc SKU..."
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => {
              setPage(1)
              setLowStockOnly(e.target.checked)
            }}
            className="rounded border-slate-300"
          />
          Chỉ sản phẩm sắp hết hàng
        </label>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <EmptyState title="Không thể tải sản phẩm" description={error} />}

      {!isLoading && !error && data?.data.length === 0 && (
        <EmptyState title="Không tìm thấy sản phẩm nào" description="Thử thay đổi bộ lọc hoặc thêm sản phẩm mới." />
      )}

      {!isLoading && data && data.data.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Sản phẩm</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">SKU</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Danh mục</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">Giá</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">Tồn kho</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{product.name}</td>
                    <td className="px-4 py-3 text-slate-500">{product.sku}</td>
                    <td className="px-4 py-3 text-slate-500">{product.category?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={product.is_low_stock ? 'font-medium text-rose-600' : 'text-slate-700'}>
                        {product.stock_quantity} {product.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/products/${product.id}/edit`}
                          className="rounded-lg px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          Sửa
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(product)}
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
              Trang {data.meta.current_page}/{data.meta.last_page} · {data.meta.total} sản phẩm
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
        title={`Xóa sản phẩm "${deleteTarget?.name}"?`}
        description="Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
