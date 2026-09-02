import { useState } from 'react'
import toast from 'react-hot-toast'
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '@/api/categories'
import { getErrorMessage } from '@/api/client'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useAsyncData } from '@/lib/useAsyncData'
import type { Category } from '@/types'

export function CategoriesPage() {
  const { data: categories, isLoading, reload } = useAsyncData(() => fetchCategories(), [])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newName.trim()) return

    setIsSubmitting(true)
    try {
      await createCategory(newName.trim())
      setNewName('')
      toast.success('Đã thêm danh mục')
      reload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setEditingName(category.name)
  }

  const saveEdit = async (id: number) => {
    if (!editingName.trim()) return
    try {
      await updateCategory(id, editingName.trim())
      toast.success('Đã cập nhật danh mục')
      setEditingId(null)
      reload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteCategory(deleteTarget.id)
      toast.success('Đã xóa danh mục')
      setDeleteTarget(null)
      reload()
    } catch (error) {
      toast.error(getErrorMessage(error))
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Danh mục</h1>
        <p className="text-sm text-slate-500">Quản lý danh mục sản phẩm</p>
      </div>

      <form onSubmit={handleCreate} className="flex max-w-md gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Tên danh mục mới"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={isSubmitting || !newName.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          Thêm
        </button>
      </form>

      {isLoading && <LoadingSpinner />}

      {!isLoading && categories?.length === 0 && (
        <EmptyState title="Chưa có danh mục nào" description="Thêm danh mục đầu tiên ở form bên trên." />
      )}

      {!isLoading && categories && categories.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Tên danh mục</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Số sản phẩm</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-4 py-3">
                    {editingId === category.id ? (
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-slate-900">{category.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{category.products_count ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    {editingId === category.id ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => saveEdit(category.id)}
                          className="rounded-lg px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-lg px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEdit(category)}
                          className="rounded-lg px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => setDeleteTarget(category)}
                          className="rounded-lg px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                        >
                          Xóa
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Xóa danh mục "${deleteTarget?.name}"?`}
        description="Sản phẩm thuộc danh mục này sẽ không còn danh mục."
        confirmLabel="Xóa"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
