import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { getErrorMessage } from '@/api/client'
import { createOrder, fetchOrder, updateOrder } from '@/api/orders'
import { fetchProducts } from '@/api/products'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatCurrency, todayLocalDate } from '@/lib/format'
import { useAsyncData } from '@/lib/useAsyncData'

const schema = z.object({
  customer_name: z.string().min(1, 'Vui lòng nhập tên khách hàng'),
  customer_phone: z.string().optional(),
  customer_address: z.string().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'cancelled']),
  order_date: z.string().min(1, 'Vui lòng chọn ngày đặt'),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        product_id: z.number().min(1, 'Chọn sản phẩm'),
        quantity: z.number().min(1, 'Số lượng phải >= 1'),
      }),
    )
    .min(1, 'Đơn hàng cần ít nhất 1 sản phẩm'),
})

type FormValues = z.infer<typeof schema>

export function OrderFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  const { data: productsPage, isLoading: isLoadingProducts } = useAsyncData(
    () => fetchProducts({ per_page: 1000 }),
    [],
  )
  const { data: order, isLoading: isLoadingOrder } = useAsyncData(
    () => (isEdit ? fetchOrder(Number(id)) : Promise.resolve(null)),
    [id],
  )

  const products = productsPage?.data ?? []

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'pending',
      order_date: todayLocalDate(),
      items: [{ product_id: 0, quantity: 1 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')

  useEffect(() => {
    if (order) {
      reset({
        customer_name: order.customer_name,
        customer_phone: order.customer_phone ?? undefined,
        customer_address: order.customer_address ?? undefined,
        status: order.status,
        order_date: order.order_date,
        notes: order.notes ?? undefined,
        items: order.items.map((item) => ({ product_id: item.product_id ?? 0, quantity: item.quantity })),
      })
    }
  }, [order, reset])

  const total = (watchedItems ?? []).reduce((sum, item) => {
    const product = products.find((p) => p.id === Number(item.product_id))
    return sum + (product ? product.price * Number(item.quantity || 0) : 0)
  }, 0)

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit) {
        await updateOrder(Number(id), values)
        toast.success('Đã cập nhật đơn hàng')
      } else {
        await createOrder(values)
        toast.success('Đã tạo đơn hàng')
      }
      navigate('/orders')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  if ((isEdit && isLoadingOrder) || isLoadingProducts) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">{isEdit ? 'Sửa đơn hàng' : 'Tạo đơn hàng'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Tên khách hàng</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...register('customer_name')}
            />
            {errors.customer_name && <p className="mt-1 text-xs text-rose-600">{errors.customer_name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Số điện thoại</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...register('customer_phone')}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Địa chỉ</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...register('customer_address')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Ngày đặt</label>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...register('order_date')}
            />
            {errors.order_date && <p className="mt-1 text-xs text-rose-600">{errors.order_date.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Trạng thái</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...register('status')}
            >
              <option value="pending">Chờ xử lý</option>
              <option value="processing">Đang xử lý</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Ghi chú</label>
            <textarea
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...register('notes')}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Sản phẩm</h2>
            <button
              type="button"
              onClick={() => append({ product_id: 0, quantity: 1 })}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              + Thêm dòng
            </button>
          </div>

          {errors.items?.message && <p className="mt-1 text-xs text-rose-600">{errors.items.message}</p>}

          <div className="mt-3 space-y-3">
            {fields.map((field, index) => {
              const selectedId = Number(watchedItems?.[index]?.product_id)
              const product = products.find((p) => p.id === selectedId)
              const quantity = Number(watchedItems?.[index]?.quantity || 0)

              return (
                <div key={field.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center">
                  <select
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    {...register(`items.${index}.product_id` as const, { valueAsNumber: true })}
                  >
                    <option value={0}>-- Chọn sản phẩm --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatCurrency(p.price)})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-24"
                    {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                  />

                  <span className="w-32 text-right text-sm text-slate-600">
                    {product ? formatCurrency(product.price * quantity) : '-'}
                  </span>

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                  >
                    Xóa
                  </button>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex justify-end border-t border-slate-100 pt-4 text-sm">
            <span className="font-semibold text-slate-900">Tổng cộng: {formatCurrency(total)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu đơn hàng'}
          </button>
        </div>
      </form>
    </div>
  )
}
