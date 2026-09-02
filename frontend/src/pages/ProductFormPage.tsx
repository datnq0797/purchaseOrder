import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { fetchCategories } from '@/api/categories'
import { getErrorMessage } from '@/api/client'
import { createProduct, fetchProduct, updateProduct } from '@/api/products'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useAsyncData } from '@/lib/useAsyncData'

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên sản phẩm'),
  sku: z.string().min(1, 'Vui lòng nhập SKU'),
  category_id: z.string().optional(),
  unit: z.string().min(1, 'Vui lòng nhập đơn vị'),
  cost_price: z.number().min(0, 'Giá vốn phải >= 0'),
  price: z.number().min(0, 'Giá bán phải >= 0'),
  stock_quantity: z.number().min(0, 'Tồn kho phải >= 0'),
  min_stock: z.number().min(0, 'Tồn kho tối thiểu phải >= 0'),
  description: z.string().optional(),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export function ProductFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  const { data: categories } = useAsyncData(() => fetchCategories(), [])
  const { data: product, isLoading: isLoadingProduct } = useAsyncData(
    () => (isEdit ? fetchProduct(Number(id)) : Promise.resolve(null)),
    [id],
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      unit: 'cái',
      cost_price: 0,
      price: 0,
      stock_quantity: 0,
      min_stock: 0,
      is_active: true,
    },
  })

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku,
        category_id: product.category_id ? String(product.category_id) : undefined,
        unit: product.unit,
        cost_price: product.cost_price,
        price: product.price,
        stock_quantity: product.stock_quantity,
        min_stock: product.min_stock,
        description: product.description ?? undefined,
        is_active: product.is_active,
      })
    }
  }, [product, reset])

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      category_id: values.category_id ? Number(values.category_id) : null,
    }

    try {
      if (isEdit) {
        await updateProduct(Number(id), payload)
        toast.success('Đã cập nhật sản phẩm')
      } else {
        await createProduct(payload)
        toast.success('Đã thêm sản phẩm')
      }
      navigate('/products')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  if (isEdit && isLoadingProduct) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Tên sản phẩm</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...register('name')}
            />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">SKU</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...register('sku')}
            />
            {errors.sku && <p className="mt-1 text-xs text-rose-600">{errors.sku.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Danh mục</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...register('category_id')}
            >
              <option value="">-- Không có --</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Đơn vị tính</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...register('unit')}
            />
            {errors.unit && <p className="mt-1 text-xs text-rose-600">{errors.unit.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Giá vốn (đ)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...register('cost_price', { valueAsNumber: true })}
            />
            {errors.cost_price && <p className="mt-1 text-xs text-rose-600">{errors.cost_price.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Giá bán (đ)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...register('price', { valueAsNumber: true })}
            />
            {errors.price && <p className="mt-1 text-xs text-rose-600">{errors.price.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Tồn kho</label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...register('stock_quantity', { valueAsNumber: true })}
            />
            {errors.stock_quantity && <p className="mt-1 text-xs text-rose-600">{errors.stock_quantity.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Tồn kho tối thiểu</label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...register('min_stock', { valueAsNumber: true })}
            />
            {errors.min_stock && <p className="mt-1 text-xs text-rose-600">{errors.min_stock.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Mô tả</label>
            <textarea
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...register('description')}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" className="rounded border-slate-300" {...register('is_active')} />
            Đang bán
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu sản phẩm'}
          </button>
        </div>
      </form>
    </div>
  )
}
