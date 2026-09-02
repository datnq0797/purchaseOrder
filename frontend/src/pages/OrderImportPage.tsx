import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { confirmOrderImport, parseOrderPdf } from '@/api/orders'
import { fetchProducts } from '@/api/products'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatCurrency, todayLocalDate } from '@/lib/format'
import { useAsyncData } from '@/lib/useAsyncData'
import type { PdfImportItem } from '@/types'

interface ReviewRow extends PdfImportItem {
  selected_product_id: number | null
  quantity_edit: number
  include: boolean
}

export function OrderImportPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: productsPage } = useAsyncData(() => fetchProducts({ per_page: 1000 }), [])
  const products = productsPage?.data ?? []

  const [isParsing, setIsParsing] = useState(false)
  const [rows, setRows] = useState<ReviewRow[] | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [orderDate, setOrderDate] = useState(todayLocalDate())

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setIsParsing(true)
    setRows(null)

    try {
      const result = await parseOrderPdf(file)
      setRows(
        result.items.map((item) => ({
          ...item,
          selected_product_id: item.matched_product_id,
          quantity_edit: item.quantity,
          include: item.matched_product_id !== null,
        })),
      )
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsParsing(false)
    }
  }

  const updateRow = (index: number, patch: Partial<ReviewRow>) => {
    setRows((prev) => (prev ? prev.map((row, i) => (i === index ? { ...row, ...patch } : row)) : prev))
  }

  const includedRows = (rows ?? []).filter((row) => row.include && row.selected_product_id)
  const total = includedRows.reduce((sum, row) => {
    const product = products.find((p) => p.id === row.selected_product_id)
    return sum + (product ? product.price * row.quantity_edit : 0)
  }, 0)

  const handleConfirm = async () => {
    if (!customerName.trim()) {
      toast.error('Vui lòng nhập tên khách hàng')
      return
    }
    if (includedRows.length === 0) {
      toast.error('Cần ít nhất 1 sản phẩm hợp lệ để tạo đơn hàng')
      return
    }

    setIsSubmitting(true)
    try {
      await confirmOrderImport({
        customer_name: customerName.trim(),
        customer_phone: customerPhone || undefined,
        order_date: orderDate,
        items: includedRows.map((row) => ({
          product_id: row.selected_product_id as number,
          quantity: row.quantity_edit,
        })),
      })
      toast.success('Đã tạo đơn hàng từ PDF')
      navigate('/orders')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Nhập đơn hàng từ PDF</h1>
        <p className="text-sm text-slate-500">
          Tải lên file PDF đơn hàng, hệ thống sẽ tự nhận diện sản phẩm/số lượng — hãy kiểm tra lại trước khi tạo đơn.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Chọn file PDF
        </button>
        {fileName && <p className="mt-2 text-sm text-slate-500">Đã chọn: {fileName}</p>}
      </div>

      {isParsing && <LoadingSpinner label="Đang đọc file PDF..." />}

      {rows && rows.length === 0 && (
        <EmptyState title="Không nhận diện được dòng sản phẩm nào" description="Thử một file PDF khác hoặc tạo đơn thủ công." />
      )}

      {rows && rows.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Tên khách hàng</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Số điện thoại</label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Ngày đặt</label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-3 text-left font-medium text-slate-500">Dùng</th>
                  <th className="px-3 py-3 text-left font-medium text-slate-500">Dòng gốc trong PDF</th>
                  <th className="px-3 py-3 text-left font-medium text-slate-500">Khớp với sản phẩm</th>
                  <th className="px-3 py-3 text-right font-medium text-slate-500">Số lượng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, index) => (
                  <tr key={index} className={row.low_confidence ? 'bg-amber-50' : undefined}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={row.include}
                        onChange={(e) => updateRow(index, { include: e.target.checked })}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="px-3 py-3 text-slate-500">{row.line_raw}</td>
                    <td className="px-3 py-3">
                      <select
                        value={row.selected_product_id ?? ''}
                        onChange={(e) =>
                          updateRow(index, {
                            selected_product_id: e.target.value ? Number(e.target.value) : null,
                            include: !!e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                      >
                        <option value="">-- Chọn sản phẩm --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatCurrency(p.price)})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min={1}
                        value={row.quantity_edit}
                        onChange={(e) => updateRow(index, { quantity_edit: Number(e.target.value) })}
                        className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-right text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
            <span className="text-sm text-slate-500">{includedRows.length} sản phẩm được chọn</span>
            <span className="text-sm font-semibold text-slate-900">Tổng cộng: {formatCurrency(total)}</span>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Đang tạo đơn...' : 'Tạo đơn hàng'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
